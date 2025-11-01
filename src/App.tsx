import { useEffect, useState } from 'react'
import {
  playersMap,
  zonesMap,
  cardsMap,
  batonMap,
  addPlayer,
  removePlayer,
  resetRoom,
  drawCards,
  millCards,
  exileFromDeck,
  shuffleDeck,
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
} from './store'
import { Zone } from './Zone'
import { JoinModal } from './JoinModal'
import { ConfirmDialog } from './ConfirmDialog'
import { OpponentBar } from './OpponentBar'
import { ChatOverlay } from './ChatOverlay'
import { ZoneDrawer } from './ZoneDrawer'
import { CompactDeck } from './CompactDeck'
import { CompactLifeCounter } from './CompactLifeCounter'

function App() {
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [currentTurn, setCurrentTurn] = useState<string>('')
  const [connected, setConnected] = useState(false)
  const [synced, setSynced] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string
    onConfirm: () => void
  } | null>(null)
  const [, forceUpdate] = useState({})

  // New UI state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [viewingOpponentId, setViewingOpponentId] = useState<string | null>(null)

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
      const baton = getTurnBaton()
      if (baton) {
        const player = playersMap.get(baton.playerId)
        setCurrentTurn(`${player?.name || baton.playerId} - ${baton.step}`)
      }
      forceUpdate({})
    }

    playersMap.observe(updateUI)
    zonesMap.observe(updateUI)
    cardsMap.observe(updateUI)
    batonMap.observe(updateUI)

    updateUI()

    return () => {
      playersMap.unobserve(updateUI)
      zonesMap.unobserve(updateUI)
      cardsMap.unobserve(updateUI)
      batonMap.unobserve(updateUI)
      provider.off('status', handleStatus)
      provider.off('synced', handleSynced)
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
        drawCards(playerId, 7)
      }
    } else {
      const decks = getStoredDecks()
      const deck = decks.find(d => d.id === deckId)
      if (deck) {
        applyDeckToPlayer(playerId, deck)
        setLastUsedDeckId(deckId)
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

  const handleRemovePlayer = (playerId: string, playerName: string) => {
    setConfirmDialog({
      message: `Remove ${playerName} from the game? This will delete their zones and cards.`,
      onConfirm: () => {
        removePlayer(playerId)

        if (playerId === currentPlayerId) {
          const storageKey = `crdt-cards-player-${getRoomName()}`
          localStorage.removeItem(storageKey)
          setCurrentPlayerId(null)
          setShowJoinModal(true)
        }

        setConfirmDialog(null)
      },
    })
  }

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
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>CRDT Cards</h1>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            {currentPlayer?.name}
            {currentTurn && ` | ${currentTurn}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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

      {/* Opponent Bar */}
      <OpponentBar
        players={players}
        currentPlayerId={currentPlayerId}
        onSelectPlayer={setViewingOpponentId}
      />

      {/* Main Content Area - Battlefield + Hand + Bottom Bar */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Battlefield - Takes most space */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
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
          <div style={{ minWidth: 0 }}>
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
                onDrawOne={() => drawCards(displayedPlayerId, 1)}
                onDrawN={(count) => drawCards(displayedPlayerId, count)}
                onMillOne={() => millCards(displayedPlayerId, 1)}
                onMillN={(count) => millCards(displayedPlayerId, count)}
                onExileOne={() => exileFromDeck(displayedPlayerId, 1)}
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

                {/* Buttons Row */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {/* Graveyard/Exile Button */}
                  <button
                    onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                    style={{
                      width: '75px',
                      height: '40px',
                      borderRadius: '6px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1976D2'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#2196F3'
                    }}
                    title="Graveyard & Exile"
                  >
                    📜
                  </button>

                  {/* Chat Button */}
                  <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    style={{
                      width: '75px',
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

      {/* Overlays */}
      <ChatOverlay
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentPlayerId={currentPlayerId}
      />

      <ZoneDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        graveyardCards={getZoneCards(`graveyard-${displayedPlayerId}`)}
        exileCards={getZoneCards(`exile-${displayedPlayerId}`)}
        playerColor={getPlayerColor(displayedPlayerId)}
        playerId={displayedPlayerId}
        isInteractive={displayedPlayerId === currentPlayerId}
        viewerPlayerId={currentPlayerId}
      />

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}

export default App
