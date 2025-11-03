import { useState } from 'react'
import { Player } from './store'

interface DangerMenuProps {
  currentPlayerId: string
  players: Array<{ id: string; player: Player }>
  onLeaveGame: () => void
  onRemovePlayer: (playerId: string) => void
  onResetRoom: () => void
}

export function DangerMenu({
  currentPlayerId,
  players,
  onLeaveGame,
  onRemovePlayer,
  onResetRoom,
}: DangerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [removePlayerMenuOpen, setRemovePlayerMenuOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }} data-danger-menu>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.5rem 0.75rem',
          fontSize: '0.75rem',
          backgroundColor: '#F44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        ⚠️ <span style={{ fontSize: '0.6rem' }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.25rem',
            backgroundColor: 'white',
            border: '2px solid #F44336',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            minWidth: '180px',
          }}
        >
          <button
            onClick={() => {
              onLeaveGame()
              setIsOpen(false)
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.875rem',
              backgroundColor: 'transparent',
              color: '#333',
              border: 'none',
              borderBottom: '1px solid #eee',
              textAlign: 'left',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            🚪 Leave Game
          </button>

          <button
            onClick={() => setRemovePlayerMenuOpen(!removePlayerMenuOpen)}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.875rem',
              backgroundColor: 'transparent',
              color: '#333',
              border: 'none',
              borderBottom: '1px solid #eee',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span>👤 Remove Player</span>
            <span style={{ fontSize: '0.7rem' }}>{removePlayerMenuOpen ? '▲' : '▼'}</span>
          </button>

          {removePlayerMenuOpen && (
            <div style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid #eee' }}>
              {players.filter(p => p.id !== currentPlayerId).map(({ id, player }) => (
                <button
                  key={id}
                  onClick={() => {
                    onRemovePlayer(id)
                    setRemovePlayerMenuOpen(false)
                    setIsOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    fontSize: '0.75rem',
                    backgroundColor: 'transparent',
                    color: '#666',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e0e0e0'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  ✕ {player.name}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              onResetRoom()
              setIsOpen(false)
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.875rem',
              backgroundColor: 'transparent',
              color: '#F44336',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ffebee'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            🔄 Reset Room
          </button>
        </div>
      )}
    </div>
  )
}
