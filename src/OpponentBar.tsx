import { Player, getPlayerColor } from './store'

interface OpponentBarProps {
  players: Array<{ id: string; player: Player }>
  currentPlayerId: string
  viewingPlayerId: string
  onSelectPlayer: (playerId: string) => void
}

export function OpponentBar({ players, currentPlayerId, viewingPlayerId, onSelectPlayer }: OpponentBarProps) {
  if (players.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid #ddd',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#666',
        }}
      >
        Waiting for players to join...
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: '#f9f9f9',
        borderBottom: '2px solid #ddd',
        display: 'flex',
        gap: '1rem',
        padding: '0.75rem 1rem',
        overflowX: 'auto',
        minHeight: '80px',
      }}
    >
      {players.map(({ id, player }) => {
        const isCurrentPlayer = id === currentPlayerId
        const isViewing = id === viewingPlayerId

        return (
          <div
            key={id}
            onClick={() => onSelectPlayer(id)}
            style={{
              flex: '0 0 auto',
              minWidth: '200px',
              backgroundColor: isViewing ? '#fffbf0' : '#fff',
              border: isViewing
                ? `3px solid ${getPlayerColor(id)}`
                : `2px solid ${getPlayerColor(id)}`,
              borderRadius: '8px',
              padding: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: isViewing ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = isViewing ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    color: getPlayerColor(id),
                  }}
                >
                  {player.name}
                </span>
                {isCurrentPlayer && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#666',
                      fontWeight: 'normal',
                    }}
                  >
                    (You)
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: player.lifeTotal <= 0 ? '#F44336' : '#333',
                }}
              >
                {player.lifeTotal} ❤️
              </span>
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#666',
                display: 'flex',
                gap: '0.5rem',
              }}
            >
              <span>📚 Deck</span>
              <span>🃏 Hand</span>
              <span>⚔️ Field</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
