import { useState } from 'react'
import {
  getPlayerCountersArray,
  modifyPlayerCounterUndoable,
  deletePlayerCounter,
  playersMap,
  BUILTIN_PLAYER_COUNTERS,
  getRecentPlayerCounterTypes,
} from './store'

interface PlayerCountersModalProps {
  isOpen: boolean
  onClose: () => void
  playerId: string
  currentPlayerId: string // The player performing actions
}

export function PlayerCountersModal({
  isOpen,
  onClose,
  playerId,
  currentPlayerId,
}: PlayerCountersModalProps) {
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customCounterName, setCustomCounterName] = useState('')
  const [showAddCommanderDamage, setShowAddCommanderDamage] = useState(false)

  if (!isOpen) return null

  const player = playersMap.get(playerId)
  const playerName = player?.name || playerId

  const counters = getPlayerCountersArray(playerId)
  const recentCustomTypes = getRecentPlayerCounterTypes()

  // Group counters by type
  const poisonCounters = counters.filter(c => c.type === 'poison')
  const commanderDamageCounters = counters.filter(c => c.type === 'commanderDamage')
  const customCounters = counters.filter(c => !c.isBuiltin)

  // Get all other players for commander damage
  const otherPlayers: Array<{ id: string; name: string }> = []
  playersMap.forEach((p, id) => {
    if (id !== playerId) {
      otherPlayers.push({ id, name: p.name })
    }
  })

  const handleAddCustomCounter = () => {
    if (!customCounterName.trim()) return

    modifyPlayerCounterUndoable(playerId, customCounterName.trim(), 1, undefined, currentPlayerId)
    setCustomCounterName('')
    setShowAddCustom(false)
  }

  const handleAddCommanderDamage = (sourcePlayerId: string) => {
    modifyPlayerCounterUndoable(playerId, 'commanderDamage', 0, sourcePlayerId, currentPlayerId)
    setShowAddCommanderDamage(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
            Player Counters - {playerName}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            ✕
          </button>
        </div>

        {/* Poison Counters */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              border: poisonCounters.length > 0 && poisonCounters[0].value >= 8
                ? `2px solid ${BUILTIN_PLAYER_COUNTERS.poison.color}`
                : '2px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>
                {BUILTIN_PLAYER_COUNTERS.poison.emoji}
              </span>
              <span style={{ fontWeight: 'bold' }}>
                {BUILTIN_PLAYER_COUNTERS.poison.name}:
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() =>
                  modifyPlayerCounterUndoable(playerId, 'poison', -1, undefined, currentPlayerId)
                }
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#f44336',
                  color: 'white',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                −
              </button>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  minWidth: '40px',
                  textAlign: 'center',
                }}
              >
                {poisonCounters.length > 0 ? poisonCounters[0].value : 0}
              </span>
              <button
                onClick={() =>
                  modifyPlayerCounterUndoable(playerId, 'poison', 1, undefined, currentPlayerId)
                }
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                +
              </button>
              {poisonCounters.length > 0 && poisonCounters[0].value > 0 && (
                <button
                  onClick={() =>
                    deletePlayerCounter(playerId, 'poison', currentPlayerId)
                  }
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#9E9E9E',
                    color: 'white',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                  title="Remove counter"
                >
                  🗑
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Commander Damage */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>
              {BUILTIN_PLAYER_COUNTERS.commanderDamage.emoji}
            </span>
            <span>{BUILTIN_PLAYER_COUNTERS.commanderDamage.name}:</span>
          </div>

          {otherPlayers.map((opponent) => {
            const counter = commanderDamageCounters.find(
              (c) => c.sourcePlayerId === opponent.id
            )
            const value = counter?.value || 0
            const hasCounter = counter !== undefined

            return (
              <div
                key={opponent.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  border: value >= 18
                    ? `2px solid ${BUILTIN_PLAYER_COUNTERS.commanderDamage.color}`
                    : '2px solid transparent',
                }}
              >
                <span>from {opponent.name}:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() =>
                      modifyPlayerCounterUndoable(
                        playerId,
                        'commanderDamage',
                        -1,
                        opponent.id,
                        currentPlayerId
                      )
                    }
                    disabled={!hasCounter || value === 0}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: hasCounter && value > 0 ? '#f44336' : '#ddd',
                      color: 'white',
                      fontSize: '1.25rem',
                      cursor: hasCounter && value > 0 ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      minWidth: '40px',
                      textAlign: 'center',
                    }}
                  >
                    {value}
                  </span>
                  <button
                    onClick={() =>
                      modifyPlayerCounterUndoable(
                        playerId,
                        'commanderDamage',
                        1,
                        opponent.id,
                        currentPlayerId
                      )
                    }
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    +
                  </button>
                  {hasCounter && value > 0 && (
                    <button
                      onClick={() =>
                        deletePlayerCounter(
                          playerId,
                          `commanderDamage:${opponent.id}`,
                          currentPlayerId
                        )
                      }
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: '#9E9E9E',
                        color: 'white',
                        fontSize: '1rem',
                        cursor: 'pointer',
                      }}
                      title="Remove counter"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Custom Counters */}
        {customCounters.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                fontSize: '1.1rem',
              }}
            >
              Custom Counters:
            </div>
            {customCounters.map((counter) => (
              <div
                key={`${counter.type}-${counter.sourcePlayerId || 'none'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ textTransform: 'capitalize' }}>{counter.type}:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() =>
                      modifyPlayerCounterUndoable(
                        playerId,
                        counter.type,
                        -1,
                        counter.sourcePlayerId,
                        currentPlayerId
                      )
                    }
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#f44336',
                      color: 'white',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      minWidth: '40px',
                      textAlign: 'center',
                    }}
                  >
                    {counter.value}
                  </span>
                  <button
                    onClick={() =>
                      modifyPlayerCounterUndoable(
                        playerId,
                        counter.type,
                        1,
                        counter.sourcePlayerId,
                        currentPlayerId
                      )
                    }
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => {
                      // For custom counters, the counterKey is just the type
                      const counterKey = counter.sourcePlayerId
                        ? `${counter.type}:${counter.sourcePlayerId}`
                        : counter.type
                      deletePlayerCounter(
                        playerId,
                        counterKey,
                        currentPlayerId
                      )
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#9E9E9E',
                      color: 'white',
                      fontSize: '1rem',
                      cursor: 'pointer',
                    }}
                    title="Remove counter"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Custom Counter Section */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #ddd' }}>
          {!showAddCustom && (
            <button
              onClick={() => setShowAddCustom(true)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              + Add Custom Counter
            </button>
          )}

          {showAddCustom && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                type="text"
                value={customCounterName}
                onChange={(e) => setCustomCounterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCustomCounter()
                  if (e.key === 'Escape') {
                    setShowAddCustom(false)
                    setCustomCounterName('')
                  }
                }}
                placeholder="Counter name (e.g., Experience, Energy)"
                autoFocus
                style={{
                  padding: '0.75rem',
                  border: '2px solid #2196F3',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
              {recentCustomTypes.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {recentCustomTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setCustomCounterName(type)
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#E3F2FD',
                        border: '1px solid #2196F3',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleAddCustomCounter}
                  disabled={!customCounterName.trim()}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: customCounterName.trim() ? '#4CAF50' : '#ddd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: customCounterName.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddCustom(false)
                    setCustomCounterName('')
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#9E9E9E',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
