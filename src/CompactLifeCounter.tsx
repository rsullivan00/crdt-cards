import { useState } from 'react'
import { modifyLifeTotal, setLifeTotal } from './store'

interface CompactLifeCounterProps {
  playerId: string
  lifeTotal: number
  playerColor: string
  currentPlayerId: string
}

export function CompactLifeCounter({
  playerId,
  lifeTotal,
  playerColor,
  currentPlayerId,
}: CompactLifeCounterProps) {
  const [showSettings, setShowSettings] = useState(false)

  const handleIncrement = () => {
    modifyLifeTotal(playerId, 1, currentPlayerId)
  }

  const handleDecrement = () => {
    modifyLifeTotal(playerId, -1, currentPlayerId)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#fff',
          border: `2px solid ${playerColor}`,
          borderRadius: '8px',
          padding: '0.5rem',
        }}
      >
        {/* Life Total Display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: lifeTotal <= 0 ? '#F44336' : '#333',
          }}
        >
          <span>❤️</span>
          <span>{lifeTotal}</span>
        </div>

        {/* Plus Button */}
        <button
          onClick={handleIncrement}
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#45a049'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4CAF50'
          }}
        >
          +
        </button>

        {/* Minus Button */}
        <button
          onClick={handleDecrement}
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#F44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#da190b'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F44336'
          }}
        >
          −
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#616161'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#757575'
          }}
        >
          ⚙️
        </button>
      </div>

      {/* Settings Menu */}
      {showSettings && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
            }}
            onClick={() => setShowSettings(false)}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: '8px',
              backgroundColor: '#fff',
              border: '2px solid #333',
              borderRadius: '6px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              zIndex: 100,
              minWidth: '180px',
            }}
          >
            <div
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                color: '#666',
                backgroundColor: '#f9f9f9',
                borderBottom: '1px solid #eee',
              }}
            >
              QUICK ADJUST
            </div>

            {/* Quick adjust buttons */}
            <div
              style={{
                padding: '0.5rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                borderBottom: '1px solid #eee',
              }}
            >
              <button
                onClick={() => {
                  modifyLifeTotal(playerId, 5, currentPlayerId)
                  setShowSettings(false)
                }}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                +5
              </button>
              <button
                onClick={() => {
                  modifyLifeTotal(playerId, -5, currentPlayerId)
                  setShowSettings(false)
                }}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#F44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                -5
              </button>
              <button
                onClick={() => {
                  modifyLifeTotal(playerId, 10, currentPlayerId)
                  setShowSettings(false)
                }}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                +10
              </button>
              <button
                onClick={() => {
                  modifyLifeTotal(playerId, -10, currentPlayerId)
                  setShowSettings(false)
                }}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#F44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                -10
              </button>
            </div>

            {/* Set exact value */}
            <div
              style={{
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                backgroundColor: 'white',
              }}
              onClick={() => {
                const value = prompt('Set life total to:', lifeTotal.toString())
                if (value !== null) {
                  const newTotal = parseInt(value, 10)
                  if (!isNaN(newTotal)) {
                    setLifeTotal(playerId, newTotal, currentPlayerId)
                  }
                }
                setShowSettings(false)
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              Set Exact Value...
            </div>
          </div>
        </>
      )}
    </div>
  )
}
