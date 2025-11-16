import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Player {
  name: string
  lifeTotal: number
}

export interface Zone {
  type: string // e.g., 'deck', 'hand', 'battlefield', 'graveyard', 'exile'
  owner?: string // playerId, undefined for shared zones
}

export interface Card {
  oracleId: string // external reference to card data/art
  owner: string // playerId
  zoneId: string
  order: number // sortable key inside zone (supports stable deck order) - also used as z-index for battlefield
  faceDown: boolean
  tapped: boolean
  counters: { [key: string]: number } // e.g., { '+1/+1': 3, 'loyalty': 4 }
  attachments: string[] // array of cardIds (auras/equipment)
  metadata: { [key: string]: any } // tokens, notes, etc.
  v: number // version counter - bump this each move for concurrency resolution
  position?: { x: number; y: number } // optional absolute positioning (battlefield only)
}

export interface Baton {
  playerId: string
  step: string // e.g., 'untap', 'upkeep', 'draw', 'main1', 'combat', 'main2', 'end'
}

export interface GameEvent {
  timestamp: number
  playerId: string
  action: string
  data: any
  type?: 'chat' | 'game' // Distinguishes chat messages from game events
}

export interface StoredDeck {
  id: string
  name: string
  moxfieldUrl: string
  moxfieldId: string
  cardCount: number
  importedAt: number
  cards: Array<{ name: string; quantity: number }>
}

export interface PlayerCounter {
  type: string           // 'poison', 'commanderDamage', or custom name
  value: number
  sourcePlayerId?: string  // Only for commander damage (which opponent)
}

// Predefined counter types with special rules
export const BUILTIN_PLAYER_COUNTERS = {
  poison: {
    name: 'Poison',
    emoji: '☠️',
    color: '#9C27B0',
    loseAt: 10
  },
  commanderDamage: {
    name: 'Commander Damage',
    emoji: '⚔️',
    color: '#F44336',
    loseAt: 21,
    isPerOpponent: true
  }
} as const

// ============================================================================
// YJS DOCUMENT SETUP
// ============================================================================

export const ydoc = new Y.Doc()

// Core game state maps
export const playersMap = ydoc.getMap<Player>('players')
export const zonesMap = ydoc.getMap<Zone>('zones')
export const cardsMap = ydoc.getMap<Card>('cards')

// Optional game state
export const batonMap = ydoc.getMap<Baton>('baton') // Single entry for turn tracking
export const seedMap = ydoc.getMap<string>('seed') // Single entry for shuffle seed
export const logArray = ydoc.getArray<GameEvent>('log') // Event log for undo/audit
export const counterTypesMap = ydoc.getMap<boolean>('counterTypes') // Track counter types used in this room
export const revealedCardMap = ydoc.getMap<{ cardName: string; revealedBy: string; timestamp: number }>('revealedCard') // Currently revealed card
export const playerCountersMap = ydoc.getMap<PlayerCounter>('playerCounters') // Player-level counters (poison, commander damage, custom)

// ============================================================================
// LOCAL SELECTION STATE (not synced via CRDT)
// ============================================================================

// Track selected card IDs (local to this client only)
const selectedCardIds = new Set<string>()
const selectionListeners: Array<() => void> = []

/**
 * Get all currently selected card IDs
 */
export function getSelectedCardIds(): Set<string> {
  return new Set(selectedCardIds)
}

/**
 * Check if a card is selected
 */
export function isCardSelected(cardId: string): boolean {
  return selectedCardIds.has(cardId)
}

/**
 * Toggle card selection
 */
export function toggleCardSelection(cardId: string): void {
  if (selectedCardIds.has(cardId)) {
    selectedCardIds.delete(cardId)
  } else {
    selectedCardIds.add(cardId)
  }
  notifySelectionListeners()
}

/**
 * Select a card (add to selection)
 */
export function selectCard(cardId: string): void {
  selectedCardIds.add(cardId)
  notifySelectionListeners()
}

/**
 * Deselect a card (remove from selection)
 */
export function deselectCard(cardId: string): void {
  selectedCardIds.delete(cardId)
  notifySelectionListeners()
}

/**
 * Clear all selections
 */
export function clearSelection(): void {
  selectedCardIds.clear()
  notifySelectionListeners()
}

/**
 * Select multiple cards
 */
export function selectCards(cardIds: string[]): void {
  cardIds.forEach(id => selectedCardIds.add(id))
  notifySelectionListeners()
}

/**
 * Subscribe to selection changes
 */
export function observeSelection(callback: () => void): void {
  selectionListeners.push(callback)
}

/**
 * Unsubscribe from selection changes
 */
export function unobserveSelection(callback: () => void): void {
  const index = selectionListeners.indexOf(callback)
  if (index > -1) {
    selectionListeners.splice(index, 1)
  }
}

/**
 * Notify all selection listeners
 */
function notifySelectionListeners(): void {
  selectionListeners.forEach(callback => callback())
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Player colors assigned in order
 */
const PLAYER_COLORS = ['#4CAF50', '#2196F3', '#F44336', '#9C27B0']

/**
 * Get assigned color for a player based on join order
 */
export function getPlayerColor(playerId: string): string {
  const players = Array.from(playersMap.keys())
  const index = players.indexOf(playerId)
  return index >= 0 && index < PLAYER_COLORS.length
    ? PLAYER_COLORS[index]
    : '#757575' // Gray fallback
}

/**
 * Add a new player to the game with zones and optionally sample cards
 */
export function addPlayer(playerId: string, name: string, skipSampleCards: boolean = false): void {
  // Don't allow more than 4 players
  if (playersMap.size >= 4) {
    console.warn('Maximum of 4 players reached')
    return
  }

  playersMap.set(playerId, { name, lifeTotal: 40 })

  // Create zones for this player
  createZone(`deck-${playerId}`, 'deck', playerId)
  createZone(`hand-${playerId}`, 'hand', playerId)
  createZone(`battlefield-${playerId}`, 'battlefield', playerId)
  createZone(`graveyard-${playerId}`, 'graveyard', playerId)
  createZone(`exile-${playerId}`, 'exile', playerId)

  // Add sample cards only if not importing a deck
  if (!skipSampleCards) {
    addSampleCardsForPlayer(playerId)
  }

  logEvent(playerId, 'player_joined', { name })
}

/**
 * Add sample cards for a new player
 */
function addSampleCardsForPlayer(playerId: string): void {
  const sampleCardNames = [
    'Lightning Bolt',
    'Giant Growth',
    'Counterspell',
    'Swords to Plowshares',
    'Dark Ritual',
    'Path to Exile',
    'Brainstorm',
    'Llanowar Elves',
    'Doom Blade',
    'Cancel',
  ]

  // Add 3 cards to hand
  for (let i = 0; i < 3; i++) {
    addCard(
      `${playerId}-card-hand-${i}`,
      sampleCardNames[i % sampleCardNames.length],
      playerId,
      `hand-${playerId}`,
      i
    )
  }

  // Add 2 cards to battlefield
  for (let i = 0; i < 2; i++) {
    addCard(
      `${playerId}-card-battlefield-${i}`,
      sampleCardNames[(i + 3) % sampleCardNames.length],
      playerId,
      `battlefield-${playerId}`,
      i
    )
  }

  // Add 50 cards to deck
  for (let i = 0; i < 50; i++) {
    addCard(
      `${playerId}-card-deck-${i}`,
      sampleCardNames[i % sampleCardNames.length],
      playerId,
      `deck-${playerId}`,
      i
    )
  }
}

/**
 * Remove a player from the game completely (including zones and cards)
 */
export function removePlayer(playerId: string): void {
  const player = playersMap.get(playerId)

  // Remove player's zones
  const zonesToRemove: string[] = []
  zonesMap.forEach((zone, zoneId) => {
    if (zone.owner === playerId) {
      zonesToRemove.push(zoneId)
    }
  })
  zonesToRemove.forEach(zoneId => zonesMap.delete(zoneId))

  // Remove player's cards
  const cardsToRemove: string[] = []
  cardsMap.forEach((card, cardId) => {
    if (card.owner === playerId) {
      cardsToRemove.push(cardId)
    }
  })
  cardsToRemove.forEach(cardId => cardsMap.delete(cardId))

  // Remove player's counters
  const counterKeysToRemove: string[] = []
  playerCountersMap.forEach((_, key) => {
    if (key.startsWith(`${playerId}-`) || key.includes(`-${playerId}`)) {
      counterKeysToRemove.push(key)
    }
  })
  counterKeysToRemove.forEach(key => playerCountersMap.delete(key))

  // Remove player
  playersMap.delete(playerId)

  // If it was their turn, advance to next player
  const baton = getTurnBaton()
  if (baton && baton.playerId === playerId) {
    const remainingPlayers = Array.from(playersMap.keys())
    if (remainingPlayers.length > 0) {
      setTurnBaton(remainingPlayers[0], 'main1')
    } else {
      batonMap.delete('current')
    }
  }

  if (player) {
    logEvent(playerId, 'player_removed', { name: player.name })
  }
}

/**
 * Reset the entire room state (clears everything)
 */
export function resetRoom(): void {
  // Clear all maps and arrays
  playersMap.clear()
  zonesMap.clear()
  cardsMap.clear()
  batonMap.clear()
  seedMap.clear()
  playerCountersMap.clear()
  logArray.delete(0, logArray.length)

  console.log('Room reset - all state cleared')
}

/**
 * Create a new zone
 */
export function createZone(zoneId: string, type: string, owner?: string): void {
  zonesMap.set(zoneId, { type, owner })
}

/**
 * Add a card to the game
 */
export function addCard(
  cardId: string,
  oracleId: string,
  owner: string,
  zoneId: string,
  order: number = 0
): void {
  cardsMap.set(cardId, {
    oracleId,
    owner,
    zoneId,
    order,
    faceDown: false,
    tapped: false,
    counters: {},
    attachments: [],
    metadata: {},
    v: 0,
  })
}

/**
 * Move a card to a new zone with optional new order
 */
export function moveCard(
  cardId: string,
  newZoneId: string,
  newOrder?: number,
  playerId?: string,
  skipLog?: boolean
): void {
  const card = cardsMap.get(cardId)
  if (!card) return

  const oldZoneId = card.zoneId

  cardsMap.set(cardId, {
    ...card,
    zoneId: newZoneId,
    order: newOrder ?? card.order,
    v: card.v + 1, // Increment version for conflict resolution
  })

  if (playerId && !skipLog) {
    logEvent(playerId, 'card_moved', {
      cardId,
      oracleId: card.oracleId,
      from: oldZoneId,
      to: newZoneId,
      order: newOrder,
    })
  }
}

/**
 * Update card state (tap/untap, flip, etc.)
 */
export function updateCard(
  cardId: string,
  updates: Partial<Omit<Card, 'v'>>,
  playerId?: string
): void {
  const card = cardsMap.get(cardId)
  if (!card) return

  cardsMap.set(cardId, {
    ...card,
    ...updates,
    v: card.v + 1,
  })

  if (playerId) {
    logEvent(playerId, 'card_updated', { cardId, updates })
  }
}

/**
 * Tap or untap a card
 */
export function setCardTapped(cardId: string, tapped: boolean, playerId?: string): void {
  const card = cardsMap.get(cardId)
  if (!card) return

  cardsMap.set(cardId, {
    ...card,
    tapped,
    v: card.v + 1,
  })

  if (playerId) {
    logEvent(playerId, 'card_updated', {
      cardId,
      oracleId: card.oracleId,  // Include card name for log display
      updates: { tapped },
    })
  }
}

/**
 * Flip a card face up or face down
 */
export function setCardFaceDown(cardId: string, faceDown: boolean, playerId?: string): void {
  updateCard(cardId, { faceDown }, playerId)
}

/**
 * Set the absolute position of a card (for battlefield free positioning)
 */
export function setCardPosition(
  cardId: string,
  x: number,
  y: number,
  _playerId?: string
): void {
  const card = cardsMap.get(cardId)
  if (!card) return

  // Get the highest order in the zone to place this card on top
  const zoneCards = getCardsInZone(card.zoneId)
  const maxOrder = zoneCards.length > 0
    ? Math.max(...zoneCards.map(c => c.order))
    : 0
  const newOrder = maxOrder + 1

  cardsMap.set(cardId, {
    ...card,
    position: { x, y },
    order: newOrder, // Update order to bring to front (z-index)
    v: card.v + 1,
  })

  // Don't log card_positioned events - they're too frequent and noisy
  // The position updates are still synced via CRDT
}

/**
 * Add or remove counters from a card
 */
export function modifyCounters(
  cardId: string,
  counterType: string,
  delta: number,
  playerId?: string
): void {
  const card = cardsMap.get(cardId)
  if (!card) return

  const counters = { ...card.counters }
  const current = counters[counterType] ?? 0
  const newValue = Math.max(0, current + delta)

  if (newValue === 0) {
    delete counters[counterType]
  } else {
    counters[counterType] = newValue
  }

  cardsMap.set(cardId, {
    ...card,
    counters,
    v: card.v + 1,
  })

  if (playerId) {
    logEvent(playerId, 'counter_modified', {
      cardId,
      oracleId: card.oracleId,
      counterType,
      delta,
      newValue,
    })
  }
}

/**
 * Attach a card to another card (auras, equipment)
 */
export function attachCard(cardId: string, targetCardId: string, playerId?: string): void {
  const targetCard = cardsMap.get(targetCardId)
  if (!targetCard) return

  const attachments = [...targetCard.attachments, cardId]
  updateCard(targetCardId, { attachments }, playerId)
}

/**
 * Detach a card from another card
 */
export function detachCard(cardId: string, targetCardId: string, playerId?: string): void {
  const targetCard = cardsMap.get(targetCardId)
  if (!targetCard) return

  const attachments = targetCard.attachments.filter((id) => id !== cardId)
  updateCard(targetCardId, { attachments }, playerId)
}

/**
 * Set a player's life total to an exact value
 */
export function setLifeTotal(playerId: string, newTotal: number, actionPlayerId?: string): void {
  const player = playersMap.get(playerId)
  if (!player) return

  playersMap.set(playerId, {
    ...player,
    lifeTotal: newTotal,
  })

  if (actionPlayerId) {
    logEvent(actionPlayerId, 'life_total_set', { playerId, newTotal })
  }
}

/**
 * Modify a player's life total by a delta amount
 */
export function modifyLifeTotal(playerId: string, delta: number, actionPlayerId?: string): void {
  const player = playersMap.get(playerId)
  if (!player) return

  const newTotal = player.lifeTotal + delta

  playersMap.set(playerId, {
    ...player,
    lifeTotal: newTotal,
  })

  if (actionPlayerId) {
    logEvent(actionPlayerId, 'life_total_modified', { playerId, delta, newTotal })
  }
}

/**
 * Set the turn baton (current player and phase/step)
 */
export function setTurnBaton(playerId: string, step: string): void {
  batonMap.set('current', { playerId, step })
  logEvent(playerId, 'turn_changed', { step })
}

/**
 * Get the current turn baton
 */
export function getTurnBaton(): Baton | undefined {
  return batonMap.get('current')
}

/**
 * Set the shuffle seed for deterministic randomness
 */
export function setShuffleSeed(seed: string): void {
  seedMap.set('current', seed)
}

/**
 * Get the current shuffle seed
 */
export function getShuffleSeed(): string | undefined {
  return seedMap.get('current')
}

/**
 * Log an event for audit/undo purposes
 */
export function logEvent(playerId: string, action: string, data: any): void {
  logArray.push([{
    timestamp: Date.now(),
    playerId,
    action,
    data,
    type: 'game',
  }])
}

/**
 * Send a chat message
 */
export function sendChatMessage(playerId: string, message: string): void {
  logArray.push([{
    timestamp: Date.now(),
    playerId,
    action: 'chat_message',
    data: { message },
    type: 'chat',
  }])
}

/**
 * Clear old log entries (optional housekeeping)
 */
export function pruneLog(keepCount: number = 100): void {
  const length = logArray.length
  if (length > keepCount) {
    logArray.delete(0, length - keepCount)
  }
}

/**
 * Get all cards in a specific zone, sorted by order
 */
export function getCardsInZone(zoneId: string): Card[] {
  const cards: Card[] = []
  cardsMap.forEach((card) => {
    if (card.zoneId === zoneId) {
      cards.push(card)
    }
  })
  return cards.sort((a, b) => a.order - b.order)
}

/**
 * Get the next available order number for a zone
 */
export function getNextOrderInZone(zoneId: string): number {
  const cards = getCardsInZone(zoneId)
  if (cards.length === 0) return 0
  return Math.max(...cards.map((c) => c.order)) + 1
}

/**
 * Draw cards from deck to hand
 */
export function drawCards(playerId: string, count: number): void {
  const deckZoneId = `deck-${playerId}`
  const handZoneId = `hand-${playerId}`

  const deckCards = getCardsInZone(deckZoneId)
  const actualCount = Math.min(count, deckCards.length)

  if (actualCount === 0) return

  const nextHandOrder = getNextOrderInZone(handZoneId)

  // Move top N cards from deck to hand (skip individual card_moved logs)
  for (let i = 0; i < actualCount; i++) {
    const card = deckCards[i]
    const cardId = Array.from(cardsMap.entries()).find(([_, c]) => c === card)?.[0]
    if (cardId) {
      moveCard(cardId, handZoneId, nextHandOrder + i, playerId, true)
    }
  }

  // Clear any revealed card since the top of deck changed
  clearRevealedCard()

  logEvent(playerId, 'draw_cards', { count: actualCount })
}

/**
 * Mill cards from deck to graveyard
 */
export function millCards(playerId: string, count: number): void {
  const deckZoneId = `deck-${playerId}`
  const graveyardZoneId = `graveyard-${playerId}`

  const deckCards = getCardsInZone(deckZoneId)
  const actualCount = Math.min(count, deckCards.length)

  if (actualCount === 0) return

  const nextGraveyardOrder = getNextOrderInZone(graveyardZoneId)

  // Move top N cards from deck to graveyard (skip individual card_moved logs)
  for (let i = 0; i < actualCount; i++) {
    const card = deckCards[i]
    const cardId = Array.from(cardsMap.entries()).find(([_, c]) => c === card)?.[0]
    if (cardId) {
      moveCard(cardId, graveyardZoneId, nextGraveyardOrder + i, playerId, true)
    }
  }

  // Clear any revealed card since the top of deck changed
  clearRevealedCard()

  logEvent(playerId, 'mill_cards', { count: actualCount })
}

/**
 * Exile cards from top of deck
 */
export function exileFromDeck(playerId: string, count: number, faceDown: boolean = false): void {
  const deckZoneId = `deck-${playerId}`
  const exileZoneId = `exile-${playerId}`

  const deckCards = getCardsInZone(deckZoneId)
  const actualCount = Math.min(count, deckCards.length)

  if (actualCount === 0) return

  const nextExileOrder = getNextOrderInZone(exileZoneId)

  // Move top N cards from deck to exile (skip individual card_moved logs)
  for (let i = 0; i < actualCount; i++) {
    const card = deckCards[i]
    const cardId = Array.from(cardsMap.entries()).find(([_, c]) => c === card)?.[0]
    if (cardId) {
      moveCard(cardId, exileZoneId, nextExileOrder + i, playerId, true)
      // Set face-down if requested
      if (faceDown) {
        setCardFaceDown(cardId, true)
      }
    }
  }

  // Clear any revealed card since the top of deck changed
  clearRevealedCard()

  logEvent(playerId, 'exile_from_deck', { count: actualCount, faceDown })
}

/**
 * Reveal top card of deck (shows to all players)
 */
export function revealTopCard(playerId: string): { cardName: string; playerName: string } | null {
  const deckZoneId = `deck-${playerId}`
  const deckCards = getCardsInZone(deckZoneId)

  if (deckCards.length === 0) return null

  const topCard = deckCards[0]
  const player = playersMap.get(playerId)
  const playerName = player?.name || playerId

  // Store the revealed card in the CRDT so all players see it
  // Store playerId (not playerName) so DeckOverlay can properly identify which deck has the reveal
  revealedCardMap.set('current', {
    cardName: topCard.oracleId,
    revealedBy: playerId,
    timestamp: Date.now(),
  })

  logEvent(playerId, 'reveal_top_card', { cardName: topCard.oracleId })

  return { cardName: topCard.oracleId, playerName }
}

/**
 * Clear the currently revealed card
 */
export function clearRevealedCard(): void {
  revealedCardMap.delete('current')
}

/**
 * Get top N cards from deck for scry/peek operations
 */
export function getTopCards(playerId: string, count: number): Array<{ cardId: string; card: Card }> {
  const deckZoneId = `deck-${playerId}`
  const deckCards = getCardsInZone(deckZoneId)
  const actualCount = Math.min(count, deckCards.length)

  const result: Array<{ cardId: string; card: Card }> = []

  for (let i = 0; i < actualCount; i++) {
    const card = deckCards[i]
    const cardId = Array.from(cardsMap.entries()).find(([_, c]) => c === card)?.[0]
    if (cardId) {
      result.push({ cardId, card })
    }
  }

  return result
}

/**
 * Get all cards in the deck
 */
export function getAllDeckCards(playerId: string): Array<{ cardId: string; card: Card }> {
  const deckZoneId = `deck-${playerId}`
  const deckCards = getCardsInZone(deckZoneId)

  const result: Array<{ cardId: string; card: Card }> = []

  for (const card of deckCards) {
    const cardId = Array.from(cardsMap.entries()).find(([_, c]) => c === card)?.[0]
    if (cardId) {
      result.push({ cardId, card })
    }
  }

  return result
}

/**
 * Reorder top cards of deck (for scry)
 * @param playerId - The player performing the scry
 * @param topCardIds - Array of card IDs in the new order (top to bottom)
 * @param bottomCardIds - Array of card IDs to put on bottom (optional)
 */
export function reorderTopCards(
  playerId: string,
  topCardIds: string[],
  bottomCardIds: string[] = []
): void {
  const deckZoneId = `deck-${playerId}`
  const deckCards = getCardsInZone(deckZoneId)

  // Get the max order in deck to append bottom cards
  const maxOrder = deckCards.length > 0 ? Math.max(...deckCards.map(c => c.order)) : 0

  // Reorder top cards (starting at 0)
  topCardIds.forEach((cardId, index) => {
    const card = cardsMap.get(cardId)
    if (card && card.zoneId === deckZoneId) {
      cardsMap.set(cardId, {
        ...card,
        order: index,
        v: card.v + 1,
      })
    }
  })

  // Put bottom cards at the end
  bottomCardIds.forEach((cardId, index) => {
    const card = cardsMap.get(cardId)
    if (card && card.zoneId === deckZoneId) {
      cardsMap.set(cardId, {
        ...card,
        order: maxOrder + index + 1,
        v: card.v + 1,
      })
    }
  })

  // Clear any revealed card since the top of deck changed
  clearRevealedCard()

  logEvent(playerId, 'scry', {
    topCount: topCardIds.length,
    bottomCount: bottomCardIds.length
  })
}

/**
 * Shuffle a player's deck
 */
export function shuffleDeck(playerId: string): void {
  const deckZoneId = `deck-${playerId}`
  const deckCards = getCardsInZone(deckZoneId)

  if (deckCards.length === 0) return

  // Get card IDs
  const cardIds: string[] = []
  cardsMap.forEach((card, cardId) => {
    if (card.zoneId === deckZoneId) {
      cardIds.push(cardId)
    }
  })

  // Shuffle using Fisher-Yates algorithm
  const shuffled = [...cardIds]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // Reassign order values
  shuffled.forEach((cardId, index) => {
    const card = cardsMap.get(cardId)
    if (card) {
      cardsMap.set(cardId, {
        ...card,
        order: index,
        v: card.v + 1,
      })
    }
  })

  // Clear any revealed card since the deck was shuffled
  clearRevealedCard()

  logEvent(playerId, 'shuffle_deck', { cardCount: shuffled.length })
}

/**
 * Move a card to a specific zone with position (top/bottom for deck)
 */
export function moveCardToZone(
  cardId: string,
  targetZoneId: string,
  position: 'top' | 'bottom' | 'auto' = 'auto',
  playerId?: string
): void {
  const card = cardsMap.get(cardId)
  if (!card) return

  let newOrder: number

  if (position === 'top') {
    // Insert at beginning (order 0, shift others up)
    const zoneCards = getCardsInZone(targetZoneId)
    zoneCards.forEach(c => {
      const cId = Array.from(cardsMap.entries()).find(([_, card]) => card === c)?.[0]
      if (cId) {
        cardsMap.set(cId, { ...c, order: c.order + 1, v: c.v + 1 })
      }
    })
    newOrder = 0
  } else if (position === 'bottom') {
    // Insert at end
    newOrder = getNextOrderInZone(targetZoneId)
  } else {
    // Auto: append to end
    newOrder = getNextOrderInZone(targetZoneId)
  }

  // Check if moving away from battlefield
  const isLeavingBattlefield = card.zoneId.startsWith('battlefield-')
  const isGoingToBattlefield = targetZoneId.startsWith('battlefield-')

  // If leaving battlefield and card is tapped, untap it silently as part of the move
  if (isLeavingBattlefield && !isGoingToBattlefield && card.tapped) {
    const oldZoneId = card.zoneId

    cardsMap.set(cardId, {
      ...card,
      tapped: false,  // Untap silently
      zoneId: targetZoneId,
      order: newOrder,
      v: card.v + 1,
    })

    // Log only the move, not the untap
    if (playerId) {
      logEvent(playerId, 'card_moved', {
        cardId,
        oracleId: card.oracleId,
        from: oldZoneId,
        to: targetZoneId,
        order: newOrder,
      })
    }
  } else {
    // Normal move without auto-untap
    moveCard(cardId, targetZoneId, newOrder, playerId)
  }
}

/**
 * Reorder a card by inserting it before or after a target card
 */
export function reorderCard(
  cardId: string,
  targetZoneId: string,
  insertBeforeCardId: string | null,
  playerId?: string
): void {
  const card = cardsMap.get(cardId)
  if (!card) return

  const zoneCards = getCardsInZone(targetZoneId).filter(c => {
    const cId = Array.from(cardsMap.entries()).find(([_, card]) => card === c)?.[0]
    return cId !== cardId // Exclude the card being moved
  })

  let newOrder: number

  if (!insertBeforeCardId) {
    // Append to end
    newOrder = zoneCards.length > 0
      ? Math.max(...zoneCards.map(c => c.order)) + 1
      : 0
  } else {
    // Find the target card
    const targetCard = cardsMap.get(insertBeforeCardId)
    if (!targetCard) {
      newOrder = getNextOrderInZone(targetZoneId)
    } else {
      // Find card before target in sorted order
      const sortedCards = zoneCards.sort((a, b) => a.order - b.order)
      const targetIndex = sortedCards.findIndex(c => {
        const cId = Array.from(cardsMap.entries()).find(([_, card]) => card === c)?.[0]
        return cId === insertBeforeCardId
      })

      if (targetIndex === 0) {
        // Insert at beginning - use half of first card's order
        newOrder = targetCard.order / 2
      } else if (targetIndex > 0) {
        // Insert between two cards - use average
        const prevCard = sortedCards[targetIndex - 1]
        newOrder = (prevCard.order + targetCard.order) / 2
      } else {
        // Target not found, append to end
        newOrder = getNextOrderInZone(targetZoneId)
      }
    }
  }

  moveCard(cardId, targetZoneId, newOrder, playerId)
}

/**
 * Create token(s) on the battlefield
 */
export function createToken(
  playerId: string,
  tokenName: string,
  quantity: number = 1,
  imageUrl?: string
): void {
  const battlefieldZoneId = `battlefield-${playerId}`
  const nextOrder = getNextOrderInZone(battlefieldZoneId)

  for (let i = 0; i < quantity; i++) {
    const tokenId = `${playerId}-token-${Date.now()}-${i}-${crypto.randomUUID()}`

    cardsMap.set(tokenId, {
      oracleId: tokenName,
      owner: playerId,
      zoneId: battlefieldZoneId,
      order: nextOrder + i,
      faceDown: false,
      tapped: false,
      counters: {},
      attachments: [],
      metadata: { isToken: true, imageUrl },
      v: 0,
    })
  }

  logEvent(playerId, 'token_created', { tokenName, quantity })
}

/**
 * Delete a card from the game (primarily for tokens)
 */
export function deleteCard(cardId: string, playerId?: string): void {
  const card = cardsMap.get(cardId)
  if (!card) return

  cardsMap.delete(cardId)

  if (playerId) {
    logEvent(playerId, 'card_deleted', { cardId, oracleId: card.oracleId })
  }
}

// ============================================================================
// PLAYER COUNTERS (poison, commander damage, custom)
// ============================================================================

/**
 * Get all counters for a player
 */
export function getPlayerCounters(playerId: string): Array<{
  type: string
  value: number
  sourcePlayerId?: string
  isBuiltin: boolean
}> {
  const counters: Array<{
    type: string
    value: number
    sourcePlayerId?: string
    isBuiltin: boolean
  }> = []

  playerCountersMap.forEach((counter, key) => {
    // Key format: ${playerId}-${type} or ${playerId}-${type}-${sourcePlayerId}
    if (key.startsWith(`${playerId}-`)) {
      const isBuiltin = counter.type === 'poison' || counter.type === 'commanderDamage'
      counters.push({
        type: counter.type,
        value: counter.value,
        sourcePlayerId: counter.sourcePlayerId,
        isBuiltin
      })
    }
  })

  return counters
}

/**
 * Modify a player counter (builtin or custom)
 */
export function modifyPlayerCounter(
  playerId: string,
  counterType: string,
  delta: number,
  sourcePlayerId?: string,
  actionPlayerId?: string
): void {
  // Build the key
  const key = sourcePlayerId
    ? `${playerId}-${counterType}-${sourcePlayerId}`
    : `${playerId}-${counterType}`

  const existing = playerCountersMap.get(key)
  const currentValue = existing?.value ?? 0
  const newValue = Math.max(0, currentValue + delta)

  if (newValue === 0) {
    // Remove counter if it reaches 0
    playerCountersMap.delete(key)
  } else {
    // Update counter
    playerCountersMap.set(key, {
      type: counterType,
      value: newValue,
      sourcePlayerId
    })
  }

  // Track counter type usage (for autocomplete suggestions)
  counterTypesMap.set(`player:${counterType}`, true)

  // Log the change
  if (actionPlayerId) {
    logEvent(actionPlayerId, 'player_counter_modified', {
      playerId,
      counterType,
      delta,
      newValue,
      sourcePlayerId
    })
  }
}

/**
 * Delete a player counter completely
 */
export function deletePlayerCounter(
  playerId: string,
  counterType: string,
  sourcePlayerId?: string,
  actionPlayerId?: string
): void {
  const key = sourcePlayerId
    ? `${playerId}-${counterType}-${sourcePlayerId}`
    : `${playerId}-${counterType}`

  playerCountersMap.delete(key)

  if (actionPlayerId) {
    logEvent(actionPlayerId, 'player_counter_deleted', {
      playerId,
      counterType,
      sourcePlayerId
    })
  }
}

/**
 * Get the value of a specific player counter
 */
export function getPlayerCounterValue(
  playerId: string,
  counterType: string,
  sourcePlayerId?: string
): number {
  const key = sourcePlayerId
    ? `${playerId}-${counterType}-${sourcePlayerId}`
    : `${playerId}-${counterType}`

  const counter = playerCountersMap.get(key)
  return counter?.value ?? 0
}

/**
 * Check if a player has lost due to counter thresholds
 */
export function checkPlayerLoss(playerId: string): {
  hasLost: boolean
  reason?: string
} {
  // Check poison counters
  const poisonCount = getPlayerCounterValue(playerId, 'poison')
  if (poisonCount >= BUILTIN_PLAYER_COUNTERS.poison.loseAt) {
    return {
      hasLost: true,
      reason: 'Poison counters'
    }
  }

  // Check commander damage from any opponent
  const allCounters = getPlayerCounters(playerId)
  const commanderDamageCounters = allCounters.filter(c => c.type === 'commanderDamage')

  for (const counter of commanderDamageCounters) {
    if (counter.value >= BUILTIN_PLAYER_COUNTERS.commanderDamage.loseAt) {
      const sourcePlayer = counter.sourcePlayerId
        ? playersMap.get(counter.sourcePlayerId)
        : null
      const sourceName = sourcePlayer?.name || 'opponent'

      return {
        hasLost: true,
        reason: `Commander damage from ${sourceName}`
      }
    }
  }

  return { hasLost: false }
}

/**
 * Get recently used custom counter types in this room
 */
export function getRecentPlayerCounterTypes(): string[] {
  const types = new Set<string>()

  counterTypesMap.forEach((_, key) => {
    if (key.startsWith('player:')) {
      const type = key.substring(7) // Remove 'player:' prefix
      // Skip builtin types
      if (type !== 'poison' && type !== 'commanderDamage') {
        types.add(type)
      }
    }
  })

  return Array.from(types)
}

// ============================================================================
// WEBRTC PROVIDER FOR REAL-TIME SYNC
// ============================================================================

/**
 * Get the room name from URL path or use default
 */
export function getRoomName(): string {
  // Use hash-based routing for room name
  const hash = window.location.hash.replace(/^#/, '')
  const roomId = hash || 'default'
  return `crdt-cards-${roomId}`
}

/**
 * WebRTC provider for peer-to-peer synchronization
 * Using Azure-hosted signaling server
 */
export const provider = new WebrtcProvider(getRoomName(), ydoc, {
  signaling: [
    'wss://crdt-cards-signaling.happyground-bfbe302d.westus2.azurecontainerapps.io',
  ],
})

// Log connection status
provider.on('status', (event: { connected: boolean }) => {
  console.log('WebRTC status:', event.connected ? 'connected' : 'disconnected')
})

provider.on('synced', (event: { synced: boolean }) => {
  console.log('YJS synced:', event.synced)
})

// Listen for URL path changes (room switching)
// Note: For SPA routing, navigation should use history.pushState
// and we listen for popstate (back/forward button)
window.addEventListener('popstate', () => {
  console.log('Room changed, reloading to connect to new room...')
  window.location.reload()
})

// ============================================================================
// INITIALIZATION
// ============================================================================

console.log('YJS document initialized:', ydoc.guid)
console.log('Room name:', getRoomName())
console.log('Game state maps ready:', {
  players: playersMap.size,
  zones: zonesMap.size,
  cards: cardsMap.size,
})

// ============================================================================
// DECK STORAGE (localStorage)
// ============================================================================

const DECKS_STORAGE_KEY = 'crdt-cards-decks'
const LAST_DECK_STORAGE_KEY = 'crdt-cards-last-deck'

/**
 * Curated list of popular Commander starter decks
 * Using local text files for reliable, offline-available decklists
 */
export const STARTER_DECKS = [
  {
    id: 'starter-atraxa',
    name: 'Atraxa, Praetors\' Voice',
    file: 'atraxa.txt',
    description: 'Proliferate & Superfriends',
  },
  {
    id: 'starter-urdragon',
    name: 'The Ur-Dragon',
    file: 'urdragon.txt',
    description: 'Dragon tribal powerhouse',
  },
  {
    id: 'starter-edgar',
    name: 'Edgar Markov',
    file: 'edgar-markov.txt',
    description: 'Vampire tribal aggro',
  },
  {
    id: 'starter-krenko',
    name: 'Krenko, Mob Boss',
    file: 'krenko.txt',
    description: 'Goblin tribal combo',
  },
  {
    id: 'starter-kaalia',
    name: 'Kaalia of the Vast',
    file: 'kaalia.txt',
    description: 'Angels, Demons, Dragons',
  },
]

/**
 * Get all stored decks from localStorage
 */
export function getStoredDecks(): StoredDeck[] {
  try {
    const stored = localStorage.getItem(DECKS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.error('Failed to load stored decks:', e)
    return []
  }
}

/**
 * Save a deck to localStorage
 */
export function saveDeck(deck: StoredDeck): void {
  try {
    const decks = getStoredDecks()
    // Replace if exists, otherwise add
    const existingIndex = decks.findIndex(d => d.id === deck.id)
    if (existingIndex >= 0) {
      decks[existingIndex] = deck
    } else {
      decks.push(deck)
    }
    localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks))
  } catch (e) {
    console.error('Failed to save deck:', e)
  }
}

/**
 * Delete a deck from localStorage
 */
export function deleteDeck(deckId: string): void {
  try {
    const decks = getStoredDecks().filter(d => d.id !== deckId)
    localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks))

    // Clear last deck if it was deleted
    if (getLastUsedDeckId() === deckId) {
      localStorage.removeItem(LAST_DECK_STORAGE_KEY)
    }
  } catch (e) {
    console.error('Failed to delete deck:', e)
  }
}

/**
 * Get the last used deck ID
 */
export function getLastUsedDeckId(): string | null {
  return localStorage.getItem(LAST_DECK_STORAGE_KEY)
}

/**
 * Set the last used deck ID
 */
export function setLastUsedDeckId(deckId: string): void {
  localStorage.setItem(LAST_DECK_STORAGE_KEY, deckId)
}

/**
 * Detect the deck platform from URL
 */
function detectDeckPlatform(url: string): 'moxfield' | 'archidekt' | 'edhrec' | 'unknown' {
  const lower = url.toLowerCase()
  if (lower.includes('moxfield.com')) return 'moxfield'
  if (lower.includes('archidekt.com')) return 'archidekt'
  if (lower.includes('edhrec.com')) return 'edhrec'
  return 'unknown'
}

/**
 * Import a deck from any supported platform (Moxfield, Archidekt, EDHRec)
 */
export async function importDeckFromMoxfield(
  deckUrl: string
): Promise<{ success: boolean; deck?: StoredDeck; error?: string }> {
  const platform = detectDeckPlatform(deckUrl)

  switch (platform) {
    case 'moxfield':
      return importFromMoxfield(deckUrl)
    case 'archidekt':
      return importFromArchidekt(deckUrl)
    case 'edhrec':
  return importFromEDHRec()
    default:
      // Try Moxfield format as fallback (might be just an ID)
      return importFromMoxfield(deckUrl)
  }
}

/**
 * Import a deck from Moxfield
 */
async function importFromMoxfield(
  moxfieldUrl: string
): Promise<{ success: boolean; deck?: StoredDeck; error?: string }> {
  try {
    // Extract deck ID from URL
    const deckId = extractMoxfieldId(moxfieldUrl)
    if (!deckId) {
      return { success: false, error: 'Invalid Moxfield URL format' }
    }

    // Fetch deck from Moxfield API using CORS proxy
    const moxfieldApiUrl = `https://api.moxfield.com/v2/decks/all/${deckId}`
    const corsProxy = 'https://corsproxy.io/?'
    const apiUrl = `${corsProxy}${encodeURIComponent(moxfieldApiUrl)}`

    const response = await fetch(apiUrl)

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Deck not found on Moxfield' }
      }
      return { success: false, error: `Failed to fetch deck (${response.status})` }
    }

    const data = await response.json()

    // Parse mainboard cards
    const cards: Array<{ name: string; quantity: number }> = []
    let cardCount = 0

    if (data.mainboard) {
      for (const [cardName, cardData] of Object.entries(data.mainboard)) {
        const quantity = (cardData as any).quantity || 1
        cards.push({ name: cardName, quantity })
        cardCount += quantity
      }
    }

    // Create stored deck object
    const deck: StoredDeck = {
      id: crypto.randomUUID(),
      name: data.name || 'Imported Deck',
      moxfieldUrl,
      moxfieldId: deckId,
      cardCount,
      importedAt: Date.now(),
      cards,
    }

    // Save to localStorage
    saveDeck(deck)

    return { success: true, deck }
  } catch (e) {
    console.error('Failed to import from Moxfield:', e)
    return { success: false, error: 'Network error or invalid deck' }
  }
}

/**
 * Import a deck from Archidekt
 */
async function importFromArchidekt(
  archidektUrl: string
): Promise<{ success: boolean; deck?: StoredDeck; error?: string }> {
  try {
    // Extract deck ID from URL: https://archidekt.com/decks/12345
    const match = archidektUrl.match(/archidekt\.com\/decks\/(\d+)/)
    if (!match) {
      return { success: false, error: 'Invalid Archidekt URL format' }
    }

    const deckId = match[1]

    // Fetch from Archidekt API using CORS proxy
    const archidektApiUrl = `https://archidekt.com/api/decks/${deckId}/`
    const corsProxy = 'https://corsproxy.io/?'
    const apiUrl = `${corsProxy}${encodeURIComponent(archidektApiUrl)}`

    const response = await fetch(apiUrl)

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Deck not found on Archidekt' }
      }
      return { success: false, error: `Failed to fetch deck (${response.status})` }
    }

    const data = await response.json()

    // Parse cards from Archidekt format
    const cards: Array<{ name: string; quantity: number }> = []
    let cardCount = 0

    if (data.cards && Array.isArray(data.cards)) {
      for (const card of data.cards) {
        const name = card.card?.oracleCard?.name || card.card?.name
        const quantity = card.quantity || 1
        if (name) {
          cards.push({ name, quantity })
          cardCount += quantity
        }
      }
    }

    // Create stored deck object
    const deck: StoredDeck = {
      id: crypto.randomUUID(),
      name: data.name || 'Imported Deck',
      moxfieldUrl: archidektUrl,
      moxfieldId: deckId,
      cardCount,
      importedAt: Date.now(),
      cards,
    }

    // Save to localStorage
    saveDeck(deck)

    return { success: true, deck }
  } catch (e) {
    console.error('Failed to import from Archidekt:', e)
    return { success: false, error: 'Network error or invalid deck' }
  }
}

/**
 * Import a deck from EDHRec (average decks or deck previews)
 */
async function importFromEDHRec(

): Promise<{ success: boolean; deck?: StoredDeck; error?: string }> {
  // TODO: Implement EDHRec scraping/parsing
  // For now, return an error
  return {
    success: false,
    error: 'EDHRec import not yet implemented. Please use Moxfield or Archidekt URLs for now.'
  }
}

/**
 * Import a deck from a local text file
 * Format: each line is "quantity cardname"
 */
export async function importFromLocalFile(
  filename: string,
  deckName: string
): Promise<{ success: boolean; deck?: StoredDeck; error?: string }> {
  try {
    // Fetch the text file from public/starter-decks/
    const response = await fetch(`/starter-decks/${filename}`)

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: `Starter deck file not found: ${filename}` }
      }
      return { success: false, error: `Failed to load starter deck (${response.status})` }
    }

    const text = await response.text()

    // Parse the text file: each line is "quantity cardname"
    const cards: Array<{ name: string; quantity: number }> = []
    let cardCount = 0

    const lines = text.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue // Skip empty lines

      // Match "number cardname" format
      const match = trimmed.match(/^(\d+)\s+(.+)$/)
      if (match) {
        const quantity = parseInt(match[1], 10)
        const name = match[2].trim()
        cards.push({ name, quantity })
        cardCount += quantity
      }
    }

    if (cards.length === 0) {
      return { success: false, error: 'No cards found in starter deck file' }
    }

    // Create stored deck object
    const deck: StoredDeck = {
      id: crypto.randomUUID(),
      name: deckName,
      moxfieldUrl: `local://${filename}`,
      moxfieldId: filename,
      cardCount,
      importedAt: Date.now(),
      cards,
    }

    // Save to localStorage
    saveDeck(deck)

    return { success: true, deck }
  } catch (e) {
    console.error('Failed to import from local file:', e)
    return { success: false, error: 'Failed to load starter deck file' }
  }
}

/**
 * Extract Moxfield deck ID from URL
 */
function extractMoxfieldId(url: string): string | null {
  // Support various formats:
  // https://www.moxfield.com/decks/aBc123DeF
  // https://moxfield.com/decks/aBc123DeF
  // www.moxfield.com/decks/aBc123DeF
  // moxfield.com/decks/aBc123DeF
  // aBc123DeF (just the ID)

  const trimmed = url.trim()

  // Try to match URL with /decks/ path
  let match = trimmed.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/)
  if (match) {
    return match[1]
  }

  // If no match, assume it's just the ID (alphanumeric, underscore, hyphen)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed
  }

  return null
}

/**
 * Apply a stored deck to a player
 */
export function applyDeckToPlayer(playerId: string, deck: StoredDeck): void {
  const deckZoneId = `deck-${playerId}`

  // Clear existing deck cards
  const cardsToRemove: string[] = []
  cardsMap.forEach((card, cardId) => {
    if (card.zoneId === deckZoneId) {
      cardsToRemove.push(cardId)
    }
  })
  cardsToRemove.forEach(cardId => cardsMap.delete(cardId))

  // Add cards from stored deck
  let order = 0
  for (const { name, quantity } of deck.cards) {
    for (let i = 0; i < quantity; i++) {
      addCard(
        `${playerId}-deck-${name}-${i}`,
        name,
        playerId,
        deckZoneId,
        order++
      )
    }
  }

  // Log the import
  logEvent(playerId, 'deck_imported', {
    deckName: deck.name,
    cardCount: deck.cardCount,
  })
}
