import { Player, getPlayerColor } from './store'

interface OpponentBarProps {
  players: Array<{ id: string; player: Player }>
  currentPlayerId: string
  onSelectPlayer: (playerId: string) => void
}

export function OpponentBar({ players, currentPlayerId, onSelectPlayer }: OpponentBarProps) {
  const opponents = players.filter(p => p.id !== currentPlayerId)

  if (opponents.length === 0) {
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
        Waiting for opponents to join...
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
      {opponents.map(({ id, player }) => (
        <div
          key={id}
          onClick={() => onSelectPlayer(id)}
          style={{
            flex: '0 0 auto',
            minWidth: '200px',
            backgroundColor: '#fff',
            border: `2px solid ${getPlayerColor(id)}`,
            borderRadius: '8px',
            padding: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontWeight: 'bold',
                fontSize: '0.875rem',
                color: getPlayerColor(id),
              }}
            >
              {player.name}
            </span>
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
      ))}
    </div>
  )
}
