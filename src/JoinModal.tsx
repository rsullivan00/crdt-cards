import { useState } from 'react'

interface JoinModalProps {
  onJoin: (name: string) => void
  playerCount: number
}

export function JoinModal({ onJoin, playerCount }: JoinModalProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onJoin(name.trim())
    }
  }

  const isFull = playerCount >= 4

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          maxWidth: '400px',
          width: '90%',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1rem', textAlign: 'center' }}>
          🎴 Join Game
        </h2>

        {isFull ? (
          <div>
            <p style={{ textAlign: 'center', color: '#F44336', marginBottom: '1rem' }}>
              This game is full (4/4 players)
            </p>
            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>
              Please try a different room or wait for a player to leave.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ marginBottom: '1rem', textAlign: 'center', color: '#666' }}>
              Players in room: {playerCount}/4
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="player-name"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}
              >
                Your Name
              </label>
              <input
                id="player-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                autoFocus
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2196F3'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ddd'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: name.trim() ? '#4CAF50' : '#ccc',
                border: 'none',
                borderRadius: '6px',
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (name.trim()) {
                  e.currentTarget.style.backgroundColor = '#45a049'
                }
              }}
              onMouseLeave={(e) => {
                if (name.trim()) {
                  e.currentTarget.style.backgroundColor = '#4CAF50'
                }
              }}
            >
              Join Game
            </button>
          </form>
        )}

        <p style={{ marginTop: '1.5rem', marginBottom: 0, fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
          Share the URL with friends to play together!
        </p>
      </div>
    </div>
  )
}
