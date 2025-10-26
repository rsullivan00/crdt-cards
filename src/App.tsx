import { useEffect, useState } from 'react'
import {
  ydoc,
  playersMap,
  zonesMap,
  cardsMap,
  addPlayer,
  createZone,
  addCard,
  moveCard,
  setCardTapped,
  getTurnBaton,
  setTurnBaton,
  Card as CardType,
  Zone as ZoneType,
} from './store'
import { Zone } from './Zone'

function App() {
  const [initialized, setInitialized] = useState(false)
  const [currentTurn, setCurrentTurn] = useState<string>('')
  const [, forceUpdate] = useState({})

  // Player colors
  const playerColors = {
    player1: '#4CAF50',
    player2: '#2196F3',
  }

  useEffect(() => {
    // Initialize some sample data
    const initGame = () => {
      // Add players if not already present
      if (playersMap.size === 0) {
        addPlayer('player1', 'Alice')
        addPlayer('player2', 'Bob')
      }

      // Create zones if not already present
      if (zonesMap.size === 0) {
        createZone('deck-player1', 'deck', 'player1')
        createZone('hand-player1', 'hand', 'player1')
        createZone('battlefield-player1', 'battlefield', 'player1')
        createZone('graveyard-player1', 'graveyard', 'player1')

        createZone('deck-player2', 'deck', 'player2')
        createZone('hand-player2', 'hand', 'player2')
        createZone('battlefield-player2', 'battlefield', 'player2')
        createZone('graveyard-player2', 'graveyard', 'player2')

        createZone('battlefield-shared', 'battlefield') // shared zone
      }

      // Add some sample cards if not already present
      if (cardsMap.size === 0) {
        // Player 1's cards
        addCard('card1', 'Lightning Bolt', 'player1', 'hand-player1', 0)
        addCard('card2', 'Forest', 'player1', 'hand-player1', 1)
        addCard('card3', 'Grizzly Bears', 'player1', 'battlefield-player1', 0)
        addCard('card4', 'Giant Growth', 'player1', 'hand-player1', 2)

        // Player 2's cards
        addCard('card5', 'Counterspell', 'player2', 'hand-player2', 0)
        addCard('card6', 'Island', 'player2', 'battlefield-player2', 0)
        addCard('card7', 'Serra Angel', 'player2', 'battlefield-player2', 1)
      }

      // Set initial turn if not set
      if (!getTurnBaton()) {
        setTurnBaton('player1', 'main1')
      }

      setInitialized(true)
    }

    initGame()

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

    // Initial update
    updateUI()

    return () => {
      playersMap.unobserve(updateUI)
      zonesMap.unobserve(updateUI)
      cardsMap.unobserve(updateUI)
    }
  }, [])

  const handleTapCard = () => {
    setCardTapped('card3', true, 'player1')
  }

  const handleUntapCard = () => {
    setCardTapped('card3', false, 'player1')
  }

  const handleMoveCard = () => {
    moveCard('card1', 'battlefield-player1', 1, 'player1')
  }

  const handleNextTurn = () => {
    const baton = getTurnBaton()
    if (baton) {
      // Simple turn rotation: player1 -> player2 -> player1
      const nextPlayer = baton.playerId === 'player1' ? 'player2' : 'player1'
      setTurnBaton(nextPlayer, 'main1')
    }
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

  if (!initialized) {
    return <div>Loading...</div>
  }

  const player1Zones = getPlayerZones('player1')
  const player2Zones = getPlayerZones('player2')

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Current Turn:</strong> {currentTurn}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            Doc: {ydoc.guid.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleTapCard}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Tap Grizzly Bears
          </button>
          <button
            onClick={handleUntapCard}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Untap Grizzly Bears
          </button>
          <button
            onClick={handleMoveCard}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Play Lightning Bolt
          </button>
          <button
            onClick={handleNextTurn}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Next Turn
          </button>
        </div>
      </div>

      {/* Game Board */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Player 1 Board */}
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
              color: playerColors.player1,
              borderBottom: `3px solid ${playerColors.player1}`,
              paddingBottom: '0.5rem',
            }}
          >
            Alice (Player 1)
          </h2>
          {player1Zones.map(({ id, zone }) => (
            <Zone
              key={id}
              zoneName={id.replace('player1', 'P1').replace('-', ' ')}
              zoneType={zone.type}
              cards={getZoneCards(id)}
              playerColor={playerColors.player1}
            />
          ))}
        </div>

        {/* Player 2 Board */}
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
              color: playerColors.player2,
              borderBottom: `3px solid ${playerColors.player2}`,
              paddingBottom: '0.5rem',
            }}
          >
            Bob (Player 2)
          </h2>
          {player2Zones.map(({ id, zone }) => (
            <Zone
              key={id}
              zoneName={id.replace('player2', 'P2').replace('-', ' ')}
              zoneType={zone.type}
              cards={getZoneCards(id)}
              playerColor={playerColors.player2}
            />
          ))}
        </div>
      </div>

      {/* Info Footer */}
      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontSize: '0.875rem',
          color: '#666',
        }}
      >
        <strong>💡 Tip:</strong> Open this app in multiple browser windows to see real-time
        collaboration! All game state changes sync automatically across clients.
      </div>
    </div>
  )
}

export default App
