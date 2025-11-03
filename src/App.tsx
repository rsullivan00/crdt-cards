import { useEffect, useState } from 'react'
import {
  playersMap,
  zonesMap,
  cardsMap,
  batonMap,
  revealedCardMap,
  addPlayer,
  resetRoom,
  drawCards,
  millCards,
  exileFromDeck,
  shuffleDeck,
  revealTopCard,
  getTurnBaton,
  setTurnBaton,
  getPlayerColor,
  Card as CardType,
  Player,
  provider,
  getRoomName,
  getStoredDecks,
  applyDeckToPlayer,
  setLastUsedDeckId,
  STARTER_DECKS,
  importFromLocalFile,
  getSelectedCardIds,
  setCardTapped,
} from './store'
import { Zone } from './Zone'
import { JoinModal } from './JoinModal'
import { ConfirmDialog } from './ConfirmDialog'
import { OpponentBar } from './OpponentBar'
import { ChatOverlay } from './ChatOverlay'
import { GraveyardOverlay } from './GraveyardOverlay'
import { ExileOverlay } from './ExileOverlay'
import { DeckOverlay } from './DeckOverlay'
import { CompactDeck } from './CompactDeck'
import { CompactLifeCounter } from './CompactLifeCounter'
import { TokenCreationModal } from './TokenCreationModal'
import { Homepage } from './Homepage'
import { HelpModal } from './HelpModal'
import { TableLayout } from './TableLayout'

function App() {
  // Check if we're on the homepage (no room hash)
  const hasRoomHash = window.location.hash && window.location.hash !== '#'

  // Show homepage if no room specified
  if (!hasRoomHash) {
    return <Homepage />
  }

  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [connected, setConnected] = useState(false)
  const [synced, setSynced] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string
    onConfirm: () => void
  } | null>(null)
  const [, forceUpdate] = useState({})

  // New UI state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isGraveyardOpen, setIsGraveyardOpen] = useState(false)
  const [isExileOpen, setIsExileOpen] = useState(false)
  const [isDeckOpen, setIsDeckOpen] = useState(false)
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [viewingOpponentId, setViewingOpponentId] = useState<string | null>(null)
  const [revealedCard, setRevealedCard] = useState<{ cardName: string; revealedBy: string } | null>(null)
  
  // Layout mode state
  const [layoutMode, setLayoutMode] = useState<'compact' | 'table'>(() => {
    const saved = localStorage.getItem('crdt-cards-layout-mode')
    return (saved === 'table' ? 'table' : 'compact') as 'compact' | 'table'
  })
  
  const toggleLayoutMode = () => {
    const newMode = layoutMode === 'compact' ? 'table' : 'compact'
    setLayoutMode(newMode)
    localStorage.setItem('crdt-cards-layout-mode', newMode)
  }

  useEffect(() => {
    // Check if player already joined this room
    const storageKey = `crdt-cards-player-${getRoomName()}`
    const savedPlayerId = localStorage.getItem(storageKey)

    if (savedPlayerId && playersMap.has(savedPlayerId)) {
      setCurrentPlayerId(savedPlayerId)
    } else {
      setShowJoinModal(true)
    }

    // Subscribe to WebRTC connection status
    const handleStatus = (event: { connected: boolean }) => {
      setConnected(event.connected)
    }

    const handleSynced = (event: { synced: boolean }) => {
      setSynced(event.synced)
      if (event.synced && savedPlayerId && !currentPlayerId) {
        if (playersMap.has(savedPlayerId)) {
          setCurrentPlayerId(savedPlayerId)
          setShowJoinModal(false)
          console.log('Rejoined as existing player:', savedPlayerId)
        }
      }
    }

    provider.on('status', handleStatus)
    provider.on('synced', handleSynced)

    // Subscribe to changes
    const updateUI = () => {
      forceUpdate({})
    }

    playersMap.observe(updateUI)
    zonesMap.observe(updateUI)
    cardsMap.observe(updateUI)
    batonMap.observe(updateUI)

    // Subscribe to revealed card changes
    const updateRevealedCard = () => {
      const revealed = revealedCardMap.get('current')
      if (revealed) {
        setRevealedCard({
          cardName: revealed.cardName,
          revealedBy: revealed.revealedBy,
        })
      } else {
        setRevealedCard(null)
      }
    }
    revealedCardMap.observe(updateRevealedCard)
    updateRevealedCard() // Initial check

    updateUI()

    // Keyboard handler for "t" key to tap/untap selected cards
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle "t" key if not typing in an input/textarea
      if (e.key === 't' || e.key === 'T') {
        const activeElement = document.activeElement
        if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
          return // Don't intercept if typing in a text field
        }

        const selectedCards = getSelectedCardIds()
        if (selectedCards.size === 0 || !currentPlayerId) return

        // Check if selected cards are in battlefield and determine new tap state
        const cardsMapData = cardsMap
        let firstCard: CardType | undefined
        let isFirstCardInBattlefield = false

        selectedCards.forEach(selectedCardId => {
          const card = cardsMapData.get(selectedCardId) as CardType
          if (card && !firstCard) {
            firstCard = card
            isFirstCardInBattlefield = card.zoneId.startsWith('battlefield-')
          }
        })

        // Only tap cards that are in battlefield
        if (firstCard && isFirstCardInBattlefield) {
          const newTappedState = !firstCard.tapped
          selectedCards.forEach(selectedCardId => {
            const card = cardsMapData.get(selectedCardId) as CardType
            if (card && card.zoneId.startsWith('battlefield-')) {
              setCardTapped(selectedCardId, newTappedState, currentPlayerId)
            }
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      playersMap.unobserve(updateUI)
      zonesMap.unobserve(updateUI)
      cardsMap.unobserve(updateUI)
      batonMap.unobserve(updateUI)
      revealedCardMap.unobserve(updateRevealedCard)
      provider.off('status', handleStatus)
      provider.off('synced', handleSynced)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentPlayerId])

  const handleJoin = async (name: string, deckId: string) => {
    const playerId = crypto.randomUUID()
    addPlayer(playerId, name, true)

    const starterDeck = STARTER_DECKS.find(d => d.id === deckId)

    if (starterDeck) {
      const result = await importFromLocalFile(starterDeck.file, starterDeck.name)
      if (result.success && result.deck) {
        applyDeckToPlayer(playerId, result.deck)
        setLastUsedDeckId(result.deck.id)
        shuffleDeck(playerId)
        drawCards(playerId, 7)
      }
    } else {
      const decks = getStoredDecks()
      const deck = decks.find(d => d.id === deckId)
      if (deck) {
        applyDeckToPlayer(playerId, deck)
        setLastUsedDeckId(deckId)
        shuffleDeck(playerId)
        drawCards(playerId, 7)
      }
    }

    const storageKey = `crdt-cards-player-${getRoomName()}`
    localStorage.setItem(storageKey, playerId)
    localStorage.setItem('crdt-cards-username', name)

    setCurrentPlayerId(playerId)
    setShowJoinModal(false)

    if (!getTurnBaton() && playersMap.size === 1) {
      setTurnBaton(playerId, 'main1')
    }
  }

  const handleNextTurn = () => {
    const baton = getTurnBaton()
    const playerIds = Array.from(playersMap.keys())

    if (baton && playerIds.length > 0) {
      const currentIndex = playerIds.indexOf(baton.playerId)
      const nextIndex = (currentIndex + 1) % playerIds.length
      setTurnBaton(playerIds[nextIndex], 'main1')
    }
  }

  // Removed handleRemovePlayer - functionality not currently used in UI

  const handleResetRoom = () => {
    setConfirmDialog({
      message: 'Reset the entire room? This will clear all players, cards, and game state.',
      onConfirm: () => {
        resetRoom()
        const storageKey = `crdt-cards-player-${getRoomName()}`
        localStorage.removeItem(storageKey)
        window.location.reload()
      },
    })
  }

  const getZoneCards = (zoneId: string): Array<{ id: string; card: CardType }> => {
    const cards: Array<{ id: string; card: CardType }> = []
    cardsMap.forEach((card, id) => {
      if (card.zoneId === zoneId) {
        cards.push({ id, card })
      }
    })
    return cards.sort((a, b) => a.card.order - b.card.order)
  }

  const players: Array<{ id: string; player: Player }> = []
  playersMap.forEach((player, id) => {
    players.push({ id, player })
  })

  if (showJoinModal) {
    return <JoinModal onJoin={handleJoin} playerCount={playersMap.size} />
  }

  if (!currentPlayerId) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  const currentPlayer = playersMap.get(currentPlayerId)
  const displayedPlayerId = viewingOpponentId || currentPlayerId

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#e0e0e0',
      }}
    >
      {/* Header - Compact */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '0.75rem 1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>{window.location.host}</h1>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            <strong>You:</strong> {currentPlayer?.name || 'Unknown'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={toggleLayoutMode}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: layoutMode === 'table' ? '#FF9800' : '#607D8B',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            title={`Switch to ${layoutMode === 'table' ? 'compact' : 'table'} view`}
          >
            {layoutMode === 'table' ? '📋 Compact' : '🎲 Table'}
          </button>
          <button
            onClick={() => setIsHelpOpen(true)}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Help"
          >
            ?
          </button>
          <button
            onClick={handleNextTurn}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Next Turn
          </button>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: connected && synced ? '#4CAF50' : '#FF9800',
            }}
          />
          <button
            onClick={handleResetRoom}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              backgroundColor: '#F44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Opponent Bar - Only show in compact mode */}
      {layoutMode === 'compact' && (
        <OpponentBar
          players={players}
          currentPlayerId={currentPlayerId}
          viewingPlayerId={viewingOpponentId || currentPlayerId}
          onSelectPlayer={(playerId) => {
            // If clicking on current player, reset to their view
            if (playerId === currentPlayerId) {
              setViewingOpponentId(null)
            } else {
              setViewingOpponentId(playerId)
            }
          }}
        />
      )}

      {/* Main Content Area - Conditional based on layout mode */}
      {layoutMode === 'table' ? (
        /* Table Layout - Full screen quadrants */
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <TableLayout
            players={players}
            currentPlayerId={currentPlayerId}
            getZoneCards={getZoneCards}
            onDrawCards={drawCards}
            onMillCards={millCards}
            onExileFromDeck={exileFromDeck}
            onShuffleDeck={shuffleDeck}
            onRevealTopCard={revealTopCard}
            onOpenGraveyard={(playerId) => {
              setViewingOpponentId(playerId === currentPlayerId ? null : playerId)
              setIsGraveyardOpen(true)
            }}
            onOpenExile={(playerId) => {
              setViewingOpponentId(playerId === currentPlayerId ? null : playerId)
              setIsExileOpen(true)
            }}
            onOpenDeck={(playerId) => {
              setViewingOpponentId(playerId === currentPlayerId ? null : playerId)
              setIsDeckOpen(true)
            }}
            onCreateToken={() => setIsTokenModalOpen(true)}
            revealedCard={revealedCard}
          />
        </div>
      ) : (
        /* Compact Layout - Current/Viewed Player Only */
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Battlefield - Takes remaining space */}
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <Zone
              zoneId={`battlefield-${displayedPlayerId}`}
              zoneName="Battlefield"
              zoneType="battlefield"
              cards={getZoneCards(`battlefield-${displayedPlayerId}`)}
              playerColor={getPlayerColor(displayedPlayerId)}
              playerId={displayedPlayerId}
              isInteractive={displayedPlayerId === currentPlayerId}
              viewerPlayerId={currentPlayerId}
            />
          </div>

          {/* Bottom Control Strip - Hand + Deck + Life/Buttons Column */}
          <div
            style={{
              flexShrink: 0,
              borderTop: '2px solid #ddd',
              backgroundColor: '#f5f5f5',
              padding: '0.75rem 1rem',
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            {/* Hand Zone */}
            <div style={{ minWidth: 0, overflow: 'visible' }}>
              <Zone
                zoneId={`hand-${displayedPlayerId}`}
                zoneName="Hand"
                zoneType="hand"
                cards={getZoneCards(`hand-${displayedPlayerId}`)}
                playerColor={getPlayerColor(displayedPlayerId)}
                playerId={displayedPlayerId}
                isInteractive={displayedPlayerId === currentPlayerId}
                viewerPlayerId={currentPlayerId}
              />
            </div>

            {/* Control Panel - Only show for current player */}
            {currentPlayer && displayedPlayerId === currentPlayerId && (
              <>
                {/* Deck */}
                <CompactDeck
                  cardCount={getZoneCards(`deck-${displayedPlayerId}`).length}
                  playerColor={getPlayerColor(displayedPlayerId)}
                  playerId={displayedPlayerId}
                  revealedCard={revealedCard}
                  onDrawOne={() => drawCards(displayedPlayerId, 1)}
                  onDrawN={(count) => drawCards(displayedPlayerId, count)}
                  onMillOne={() => millCards(displayedPlayerId, 1)}
                  onMillN={(count) => millCards(displayedPlayerId, count)}
                  onExileOne={(faceDown) => exileFromDeck(displayedPlayerId, 1, faceDown)}
                  onExileN={(count, faceDown) => exileFromDeck(displayedPlayerId, count, faceDown)}
                  onRevealTop={() => {
                    revealTopCard(displayedPlayerId)
                  }}
                  onShuffle={() => shuffleDeck(displayedPlayerId)}
                />

                {/* Life Counter + Buttons Column */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {/* Life Counter */}
                  <CompactLifeCounter
                    playerId={displayedPlayerId}
                    lifeTotal={currentPlayer.lifeTotal}
                    playerColor={getPlayerColor(displayedPlayerId)}
                    currentPlayerId={currentPlayerId}
                  />

                  {/* Quick Action Buttons Grid */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* Graveyard Button */}
                    <button
                      onClick={() => setIsGraveyardOpen(!isGraveyardOpen)}
                      style={{
                        width: '50px',
                        height: '40px',
                        borderRadius: '6px',
                        backgroundColor: '#9C27B0',
                        color: 'white',
                        border: 'none',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#7B1FA2'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#9C27B0'
                      }}
                      title="Graveyard"
                    >
                      💀
                    </button>

                    {/* Exile Button */}
                    <button
                      onClick={() => setIsExileOpen(!isExileOpen)}
                      style={{
                        width: '50px',
                        height: '40px',
                        borderRadius: '6px',
                        backgroundColor: '#9C27B0',
                        color: 'white',
                        border: 'none',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#7B1FA2'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#9C27B0'
                      }}
                      title="Exile"
                    >
                      🚫
                    </button>

                    {/* Token Button */}
                    <button
                      onClick={() => setIsTokenModalOpen(!isTokenModalOpen)}
                      style={{
                        width: '50px',
                        height: '40px',
                        borderRadius: '6px',
                        backgroundColor: '#FF9800',
                        color: 'white',
                        border: 'none',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F57C00'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FF9800'
                      }}
                      title="Create Tokens"
                    >
                      🪙
                    </button>

                    {/* Chat Button */}
                    <button
                      onClick={() => setIsChatOpen(!isChatOpen)}
                      style={{
                        width: '50px',
                        height: '40px',
                        borderRadius: '6px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#388E3C'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#4CAF50'
                      }}
                      title="Chat & Log"
                    >
                      💬
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Zone Overlays - Available in both layout modes */}
      <GraveyardOverlay
        isOpen={isGraveyardOpen}
        onClose={() => setIsGraveyardOpen(false)}
        cards={getZoneCards(`graveyard-${displayedPlayerId}`)}
        playerColor={getPlayerColor(displayedPlayerId)}
        playerId={displayedPlayerId}
        isInteractive={displayedPlayerId === currentPlayerId}
        viewerPlayerId={currentPlayerId}
      />

      <ExileOverlay
        isOpen={isExileOpen}
        onClose={() => setIsExileOpen(false)}
        cards={getZoneCards(`exile-${displayedPlayerId}`)}
        playerColor={getPlayerColor(displayedPlayerId)}
        playerId={displayedPlayerId}
        isInteractive={displayedPlayerId === currentPlayerId}
        viewerPlayerId={currentPlayerId}
      />

      <DeckOverlay
        isOpen={isDeckOpen}
        onClose={() => setIsDeckOpen(false)}
        cards={getZoneCards(`deck-${displayedPlayerId}`)}
        playerColor={getPlayerColor(displayedPlayerId)}
        playerId={displayedPlayerId}
        viewerPlayerId={currentPlayerId}
        revealedCard={revealedCard}
      />

      {/* Chat Overlay */}
      <ChatOverlay
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentPlayerId={currentPlayerId}
      />

      {/* Token Creation Modal */}
      {isTokenModalOpen && (
        <TokenCreationModal
          playerId={currentPlayerId}
          onClose={() => setIsTokenModalOpen(false)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  )
}

export default App
