import { useEffect, useState } from 'react'
import {
  ydoc,
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
  moveCard,
  setCardTapped,
  getTurnBaton,
  setTurnBaton,
  getPlayerColor,
  Card as CardType,
  Zone as ZoneType,
  Player,
  provider,
  getRoomName,
} from './store'
import { Zone } from './Zone'
import { JoinModal } from './JoinModal'
import { ConfirmDialog } from './ConfirmDialog'

type ViewMode = 'focused' | 'grid'

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

  // New layout state
  const [viewMode, setViewMode] = useState<ViewMode>('focused')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)

  useEffect(() => {
    // Check if player already joined this room
    const storageKey = `crdt-cards-player-${getRoomName()}`
    const savedPlayerId = localStorage.getItem(storageKey)

    if (savedPlayerId && playersMap.has(savedPlayerId)) {
      // Player already exists in this room
      setCurrentPlayerId(savedPlayerId)
      setSelectedPlayerId(savedPlayerId) // Default to viewing own board
    } else {
      // New player needs to join
      setShowJoinModal(true)
    }

    // Load view preferences
    const savedViewMode = localStorage.getItem(`crdt-cards-viewmode-${getRoomName()}`)
    if (savedViewMode === 'grid' || savedViewMode === 'focused') {
      setViewMode(savedViewMode)
    }

    // Subscribe to WebRTC connection status
    const handleStatus = (event: { connected: boolean }) => {
      setConnected(event.connected)
    }

    const handleSynced = (event: { synced: boolean }) => {
      setSynced(event.synced)
      // After sync, check if saved player still exists
      if (savedPlayerId && !playersMap.has(savedPlayerId)) {
        // Player was removed, show join modal again
        localStorage.removeItem(storageKey)
        setCurrentPlayerId(null)
        setSelectedPlayerId(null)
        setShowJoinModal(true)
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
      forceUpdate({}) // Force re-render
    }

    playersMap.observe(updateUI)
    zonesMap.observe(updateUI)
    cardsMap.observe(updateUI)
    batonMap.observe(updateUI)

    // Initial update
    updateUI()

    return () => {
      playersMap.unobserve(updateUI)
      zonesMap.unobserve(updateUI)
      cardsMap.unobserve(updateUI)
      batonMap.unobserve(updateUI)
      provider.off('status', handleStatus)
      provider.off('synced', handleSynced)
    }
  }, [])

  const handleJoin = (name: string) => {
    const playerId = crypto.randomUUID()
    addPlayer(playerId, name)

    // Save to localStorage
    const storageKey = `crdt-cards-player-${getRoomName()}`
    localStorage.setItem(storageKey, playerId)

    setCurrentPlayerId(playerId)
    setSelectedPlayerId(playerId)
    setShowJoinModal(false)

    // Set initial turn to first player if not set
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

        // If removing yourself, clear localStorage and rejoin
        if (playerId === currentPlayerId) {
          const storageKey = `crdt-cards-player-${getRoomName()}`
          localStorage.removeItem(storageKey)
          setCurrentPlayerId(null)
          setSelectedPlayerId(null)
          setShowJoinModal(true)
        }

        // If viewing removed player, switch to current player
        if (playerId === selectedPlayerId && currentPlayerId) {
          setSelectedPlayerId(currentPlayerId)
        }

        setConfirmDialog(null)
      },
    })
  }

  const handleResetRoom = () => {
    setConfirmDialog({
      message: 'Reset the entire room? This will clear all players, cards, and game state. This cannot be undone.',
      onConfirm: () => {
        resetRoom()

        // Clear localStorage for this room
        const storageKey = `crdt-cards-player-${getRoomName()}`
        localStorage.removeItem(storageKey)

        // Reload page to fresh state
        window.location.reload()
      },
    })
  }

  const toggleViewMode = () => {
    const newMode: ViewMode = viewMode === 'focused' ? 'grid' : 'focused'
    setViewMode(newMode)
    localStorage.setItem(`crdt-cards-viewmode-${getRoomName()}`, newMode)
  }

  // Get cards for a specific zone
  const getZoneCards = (zoneId: string): Array<{ id: string; card: CardType }> => {
    const cards: Array<{ id: string; card: CardType }> = []
    cardsMap.forEach((card, id) => {
      if (card.zoneId === zoneId) {
        cards.push({ id, card })
      }
    })
    return cards.sort((a, b) => a.card.order - b.card.order)
  }

  // Get zones for a player
  const getPlayerZones = (playerId: string): Array<{ id: string; zone: ZoneType }> => {
    const zones: Array<{ id: string; zone: ZoneType }> = []
    zonesMap.forEach((zone, id) => {
      if (zone.owner === playerId) {
        zones.push({ id, zone })
      }
    })
    return zones
  }

  // Get all players as array
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
  const viewedPlayerId = selectedPlayerId || currentPlayerId

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#e0e0e0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>CRDT Cards</h1>
            <div style={{ fontSize: '0.875rem' }}>
              <strong>You:</strong> {currentPlayer?.name || 'Unknown'}
              {currentTurn && (
                <>
                  {' | '}
                  <strong>Turn:</strong> {currentTurn}
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={toggleViewMode}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {viewMode === 'focused' ? '⊞ Grid View' : '⊡ Focused View'}
            </button>
            <button
              onClick={handleNextTurn}
              disabled={players.length === 0}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                backgroundColor: players.length > 0 ? '#9C27B0' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: players.length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              Next Turn
            </button>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: connected && synced ? '#4CAF50' : '#FF9800',
                fontSize: '0.75rem',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: connected && synced ? '#4CAF50' : '#FF9800',
                }}
              />
              {connected && synced ? 'Connected' : connected ? 'Syncing...' : 'Connecting...'}
            </div>
            <button
              onClick={handleResetRoom}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: '#F44336',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reset Room
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'focused' ? (
        // Focused Mode Layout
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Player Rail */}
          <div
            style={{
              width: '200px',
              backgroundColor: '#fff',
              boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
              padding: '1rem',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#666' }}>
              PLAYERS ({players.length}/4)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {players.map(({ id, player }) => (
                <div
                  key={id}
                  onClick={() => setSelectedPlayerId(id)}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: id === viewedPlayerId ? getPlayerColor(id) : '#f5f5f5',
                    color: id === viewedPlayerId ? 'white' : '#333',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: id === viewedPlayerId ? 'bold' : 'normal',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (id !== viewedPlayerId) {
                      e.currentTarget.style.backgroundColor = '#e0e0e0'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (id !== viewedPlayerId) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                    }
                  }}
                >
                  <span>
                    {player.name}
                    {id === currentPlayerId && ' (You)'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemovePlayer(id, player.name)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: id === viewedPlayerId ? 'white' : '#666',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      lineHeight: 1,
                      padding: '0 0.25rem',
                      opacity: 0.7,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.7'
                    }}
                    title={`Remove ${player.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {currentPlayerId !== viewedPlayerId && (
              <button
                onClick={() => setSelectedPlayerId(currentPlayerId)}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem',
                  width: '100%',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ← My Board
              </button>
            )}
          </div>

          {/* Main Stage */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
            {players.find(p => p.id === viewedPlayerId) && (
              <div
                style={{
                  backgroundColor: '#fff',
                  padding: '1rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <h2
                  style={{
                    margin: '0 0 1rem 0',
                    color: getPlayerColor(viewedPlayerId),
                    borderBottom: `3px solid ${getPlayerColor(viewedPlayerId)}`,
                    paddingBottom: '0.5rem',
                  }}
                >
                  {playersMap.get(viewedPlayerId)?.name || 'Unknown'}
                  {viewedPlayerId === currentPlayerId && ' (You)'}
                </h2>
                {getPlayerZones(viewedPlayerId).map(({ id: zoneId, zone }) => (
                  <Zone
                    key={zoneId}
                    zoneName={zone.type.charAt(0).toUpperCase() + zone.type.slice(1)}
                    zoneType={zone.type}
                    cards={getZoneCards(zoneId)}
                    playerColor={getPlayerColor(viewedPlayerId)}
                    playerId={viewedPlayerId}
                    onDrawCards={zone.type === 'deck' && viewedPlayerId === currentPlayerId ? (count) => drawCards(viewedPlayerId, count) : undefined}
                    onMillCards={zone.type === 'deck' && viewedPlayerId === currentPlayerId ? (count) => millCards(viewedPlayerId, count) : undefined}
                    onExileFromDeck={zone.type === 'deck' && viewedPlayerId === currentPlayerId ? (count) => exileFromDeck(viewedPlayerId, count) : undefined}
                    onShuffleDeck={zone.type === 'deck' && viewedPlayerId === currentPlayerId ? () => shuffleDeck(viewedPlayerId) : undefined}
                    isInteractive={viewedPlayerId === currentPlayerId}
                    viewerPlayerId={currentPlayerId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Grid Mode Layout
        <div style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: players.length === 1 ? '1fr' : players.length === 2 ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
              gridTemplateRows: players.length <= 2 ? '1fr' : 'repeat(2, 1fr)',
              gap: '1rem',
              height: players.length <= 2 ? '100%' : 'calc(100vh - 150px)',
            }}
          >
            {players.map(({ id, player }) => {
              const zones = getPlayerZones(id)
              const playerColor = getPlayerColor(id)
              const isCurrentPlayer = id === currentPlayerId

              return (
                <div
                  key={id}
                  style={{
                    backgroundColor: '#fff',
                    padding: '1rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <h2
                    style={{
                      margin: '0 0 1rem 0',
                      color: playerColor,
                      borderBottom: `3px solid ${playerColor}`,
                      paddingBottom: '0.5rem',
                      fontSize: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>
                      {player.name}
                      {id === currentPlayerId && ' (You)'}
                    </span>
                    <button
                      onClick={() => handleRemovePlayer(id, player.name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: playerColor,
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        lineHeight: 1,
                        padding: '0 0.25rem',
                        opacity: 0.7,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.7'
                      }}
                      title={`Remove ${player.name}`}
                    >
                      ×
                    </button>
                  </h2>
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    {zones.map(({ id: zoneId, zone }) => (
                      <Zone
                        key={zoneId}
                        zoneName={zone.type.charAt(0).toUpperCase() + zone.type.slice(1)}
                        zoneType={zone.type}
                        cards={getZoneCards(zoneId)}
                        playerColor={playerColor}
                        playerId={id}
                        onDrawCards={zone.type === 'deck' && isCurrentPlayer ? (count) => drawCards(id, count) : undefined}
                        onMillCards={zone.type === 'deck' && isCurrentPlayer ? (count) => millCards(id, count) : undefined}
                        onExileFromDeck={zone.type === 'deck' && isCurrentPlayer ? (count) => exileFromDeck(id, count) : undefined}
                        onShuffleDeck={zone.type === 'deck' && isCurrentPlayer ? () => shuffleDeck(id) : undefined}
                        isInteractive={isCurrentPlayer}
                        viewerPlayerId={currentPlayerId}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Info Footer */}
      {players.length < 4 && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fff',
            boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
            fontSize: '0.875rem',
            color: '#666',
            textAlign: 'center',
          }}
        >
          <strong>💡 Waiting for players...</strong>
          <br />
          Share this URL: <code style={{ backgroundColor: '#f5f5f5', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{window.location.href}</code>
        </div>
      )}

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
