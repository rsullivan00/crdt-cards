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

  useEffect(() => {
    // Check if player already joined this room
    const storageKey = `crdt-cards-player-${getRoomName()}`
    const savedPlayerId = localStorage.getItem(storageKey)

    if (savedPlayerId && playersMap.has(savedPlayerId)) {
      // Player already exists in this room
      setCurrentPlayerId(savedPlayerId)
    } else {
      // New player needs to join
      setShowJoinModal(true)
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
          setShowJoinModal(true)
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

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '1rem',
        backgroundColor: '#e0e0e0',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ margin: '0 0 0.5rem 0' }}>CRDT Cards</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>You:</strong> {currentPlayer?.name || 'Unknown'}
            {currentTurn && (
              <>
                {' | '}
                <strong>Turn:</strong> {currentTurn}
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem', flexWrap: 'wrap' }}>
            <div>
              <strong>Room:</strong> {getRoomName().replace('crdt-cards-', '')}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: connected && synced ? '#4CAF50' : '#FF9800',
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
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: '#F44336',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d32f2f'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F44336'
              }}
            >
              Reset Room
            </button>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0 }}>Players ({players.length}/4)</h3>
          <button
            onClick={handleNextTurn}
            disabled={players.length === 0}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: players.length > 0 ? '#9C27B0' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: players.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            Next Turn
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {players.map(({ id, player }) => (
            <div
              key={id}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: getPlayerColor(id),
                color: 'white',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
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
                  color: 'white',
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
      </div>

      {/* Game Board - 2x2 Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: players.length === 1 ? '1fr' : '1fr 1fr',
          gap: '1rem',
        }}
      >
        {players.map(({ id, player }) => {
          const zones = getPlayerZones(id)
          const playerColor = getPlayerColor(id)

          return (
            <div
              key={id}
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
                  color: playerColor,
                  borderBottom: `3px solid ${playerColor}`,
                  paddingBottom: '0.5rem',
                }}
              >
                {player.name}
                {id === currentPlayerId && ' (You)'}
              </h2>
              {zones.map(({ id: zoneId, zone }) => (
                <Zone
                  key={zoneId}
                  zoneName={zone.type.charAt(0).toUpperCase() + zone.type.slice(1)}
                  zoneType={zone.type}
                  cards={getZoneCards(zoneId)}
                  playerColor={playerColor}
                />
              ))}
            </div>
          )
        })}
      </div>

      {/* Info Footer */}
      {players.length < 4 && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontSize: '0.875rem',
            color: '#666',
            textAlign: 'center',
          }}
        >
          <strong>💡 Waiting for players...</strong>
          <br />
          Share this URL with friends: <code style={{ backgroundColor: '#f5f5f5', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{window.location.href}</code>
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
