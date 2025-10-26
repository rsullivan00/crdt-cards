import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Player {
  name: string
}

export interface Zone {
  type: string // e.g., 'deck', 'hand', 'battlefield', 'graveyard', 'exile'
  owner?: string // playerId, undefined for shared zones
}

export interface Card {
  oracleId: string // external reference to card data/art
  owner: string // playerId
  zoneId: string
  order: number // sortable key inside zone (supports stable deck order)
  faceDown: boolean
  tapped: boolean
  counters: { [key: string]: number } // e.g., { '+1/+1': 3, 'loyalty': 4 }
  attachments: string[] // array of cardIds (auras/equipment)
  metadata: { [key: string]: any } // tokens, notes, etc.
  v: number // version counter - bump this each move for concurrency resolution
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
}

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
 * Add a new player to the game with zones and sample cards
 */
export function addPlayer(playerId: string, name: string): void {
  // Don't allow more than 4 players
  if (playersMap.size >= 4) {
    console.warn('Maximum of 4 players reached')
    return
  }

  playersMap.set(playerId, { name })

  // Create zones for this player
  createZone(`deck-${playerId}`, 'deck', playerId)
  createZone(`hand-${playerId}`, 'hand', playerId)
  createZone(`battlefield-${playerId}`, 'battlefield', playerId)
  createZone(`graveyard-${playerId}`, 'graveyard', playerId)
  createZone(`exile-${playerId}`, 'exile', playerId)

  // Add sample cards
  addSampleCardsForPlayer(playerId)

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
  playerId?: string
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

  if (playerId) {
    logEvent(playerId, 'card_moved', {
      cardId,
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
  updateCard(cardId, { tapped }, playerId)
}

/**
 * Flip a card face up or face down
 */
export function setCardFaceDown(cardId: string, faceDown: boolean, playerId?: string): void {
  updateCard(cardId, { faceDown }, playerId)
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

  updateCard(cardId, { counters }, playerId)
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

  // Move top N cards from deck to hand
  for (let i = 0; i < actualCount; i++) {
    const card = deckCards[i]
    const cardId = Array.from(cardsMap.entries()).find(([_, c]) => c === card)?.[0]
    if (cardId) {
      moveCard(cardId, handZoneId, nextHandOrder + i, playerId)
    }
  }

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

  // Move top N cards from deck to graveyard
  for (let i = 0; i < actualCount; i++) {
    const card = deckCards[i]
    const cardId = Array.from(cardsMap.entries()).find(([_, c]) => c === card)?.[0]
    if (cardId) {
      moveCard(cardId, graveyardZoneId, nextGraveyardOrder + i, playerId)
    }
  }

  logEvent(playerId, 'mill_cards', { count: actualCount })
}

/**
 * Exile cards from top of deck
 */
export function exileFromDeck(playerId: string, count: number): void {
  const deckZoneId = `deck-${playerId}`
  const exileZoneId = `exile-${playerId}`

  const deckCards = getCardsInZone(deckZoneId)
  const actualCount = Math.min(count, deckCards.length)

  if (actualCount === 0) return

  const nextExileOrder = getNextOrderInZone(exileZoneId)

  // Move top N cards from deck to exile
  for (let i = 0; i < actualCount; i++) {
    const card = deckCards[i]
    const cardId = Array.from(cardsMap.entries()).find(([_, c]) => c === card)?.[0]
    if (cardId) {
      moveCard(cardId, exileZoneId, nextExileOrder + i, playerId)
    }
  }

  logEvent(playerId, 'exile_from_deck', { count: actualCount })
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

  moveCard(cardId, targetZoneId, newOrder, playerId)
}

// ============================================================================
// WEBRTC PROVIDER FOR REAL-TIME SYNC
// ============================================================================

/**
 * Get the room name from URL hash or use default
 */
export function getRoomName(): string {
  const hash = window.location.hash.slice(1) // Remove '#'
  const roomId = hash || 'default'
  return `crdt-cards-${roomId}`
}

/**
 * WebRTC provider for peer-to-peer synchronization
 */
export const provider = new WebrtcProvider(getRoomName(), ydoc, {
  signaling: [
    'wss://signaling.yjs.dev',
    'wss://y-webrtc-signaling-eu.herokuapp.com',
    'wss://y-webrtc-signaling-us.herokuapp.com',
  ],
})

// Log connection status
provider.on('status', (event: { connected: boolean }) => {
  console.log('WebRTC status:', event.connected ? 'connected' : 'disconnected')
})

provider.on('synced', (event: { synced: boolean }) => {
  console.log('YJS synced:', event.synced)
})

// Listen for URL hash changes (room switching)
window.addEventListener('hashchange', () => {
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
