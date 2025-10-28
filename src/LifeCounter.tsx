import { useState } from 'react'
import { modifyLifeTotal } from './store'

interface LifeCounterProps {
  playerId: string
  playerName: string
  lifeTotal: number
  playerColor: string
  currentPlayerId: string
  compact?: boolean
}

export function LifeCounter({
  playerId,
  playerName,
  lifeTotal,
  playerColor,
  currentPlayerId,
  compact = false,
}: LifeCounterProps) {
  const [showModal, setShowModal] = useState(false)

  const handleModify = (delta: number) => {
    modifyLifeTotal(playerId, delta, currentPlayerId)
  }

  const handleCustomAmount = (amount: number) => {
    modifyLifeTotal(playerId, amount, currentPlayerId)
    setShowModal(false)
  }

  if (compact) {
    // Compact version for player rail
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          padding: '0.5rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '6px',
          marginTop: '0.5rem',
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
              fontSize: '0.75rem',
              color: '#666',
              fontWeight: 'bold',
            }}
          >
            LIFE
          </span>
          <span
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: playerColor,
            }}
          >
            {lifeTotal}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.25rem',
          }}
        >
          <button
            onClick={() => handleModify(-5)}
            style={{
              padding: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: '#F44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            -5
          </button>
          <button
            onClick={() => handleModify(-1)}
            style={{
              padding: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            -1
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ±N
          </button>
          <button
            onClick={() => handleModify(+5)}
            style={{
              padding: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            +5
          </button>
          <button
            onClick={() => handleModify(+1)}
            style={{
              padding: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: '#8BC34A',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            +1
          </button>
        </div>

        {showModal && (
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
            onClick={() => setShowModal(false)}
          >
            <div
              style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                minWidth: '250px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>
                Modify Life Total
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => {
                    const amount = prompt('Lose how much life?', '1')
                    if (amount) {
                      const num = parseInt(amount, 10)
                      if (!isNaN(num) && num > 0) {
                        handleCustomAmount(-num)
                      }
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    backgroundColor: '#F44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Lose Life
                </button>
                <button
                  onClick={() => {
                    const amount = prompt('Gain how much life?', '1')
                    if (amount) {
                      const num = parseInt(amount, 10)
                      if (!isNaN(num) && num > 0) {
                        handleCustomAmount(num)
                      }
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Gain Life
                </button>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: '#666',
                  backgroundColor: '#f5f5f5',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Full version for grid view headers
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: '80px',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            color: '#666',
            fontWeight: 'bold',
          }}
        >
          LIFE
        </span>
        <span
          style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: playerColor,
            lineHeight: 1,
          }}
        >
          {lifeTotal}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          flex: 1,
        }}
      >
        <button
          onClick={() => handleModify(-5)}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            backgroundColor: '#F44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: '1 1 auto',
            minWidth: '60px',
          }}
        >
          -5
        </button>
        <button
          onClick={() => handleModify(-1)}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: '1 1 auto',
            minWidth: '60px',
          }}
        >
          -1
        </button>
        <button
          onClick={() => handleModify(+1)}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            backgroundColor: '#8BC34A',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: '1 1 auto',
            minWidth: '60px',
          }}
        >
          +1
        </button>
        <button
          onClick={() => handleModify(+5)}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: '1 1 auto',
            minWidth: '60px',
          }}
        >
          +5
        </button>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            backgroundColor: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: '0 1 auto',
            minWidth: '60px',
          }}
        >
          ± Custom
        </button>
      </div>

      {showModal && (
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
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              minWidth: '250px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>
              Modify Life Total
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                onClick={() => {
                  const amount = prompt('Lose how much life?', '1')
                  if (amount) {
                    const num = parseInt(amount, 10)
                    if (!isNaN(num) && num > 0) {
                      handleCustomAmount(-num)
                    }
                  }
                }}
                style={{
                  flex: 1,
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  backgroundColor: '#F44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Lose Life
              </button>
              <button
                onClick={() => {
                  const amount = prompt('Gain how much life?', '1')
                  if (amount) {
                    const num = parseInt(amount, 10)
                    if (!isNaN(num) && num > 0) {
                      handleCustomAmount(num)
                    }
                  }
                }}
                style={{
                  flex: 1,
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Gain Life
              </button>
            </div>
            <button
              onClick={() => setShowModal(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                color: '#666',
                backgroundColor: '#f5f5f5',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
