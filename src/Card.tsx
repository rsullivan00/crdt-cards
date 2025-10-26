import { useState, useEffect } from 'react'
import { Card as CardType, moveCardToZone, setCardTapped, modifyCounters, counterTypesMap } from './store'
import { NumberInputModal } from './NumberInputModal'
import { TextInputModal } from './TextInputModal'

interface CardProps {
  card: CardType
  cardId: string
  playerColor: string
  playerId: string
}

export function Card({ card, cardId, playerColor, playerId }: CardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false)
  const [counterModal, setCounterModal] = useState<{
    type: 'set' | 'add'
    counterType?: string
  } | null>(null)
  const [knownCounterTypes, setKnownCounterTypes] = useState<string[]>([])

  // Subscribe to counter types map
  useEffect(() => {
    const updateCounterTypes = () => {
      const types: string[] = []
      counterTypesMap.forEach((_, type) => {
        types.push(type)
      })
      setKnownCounterTypes(types)
    }

    counterTypesMap.observe(updateCounterTypes)
    updateCounterTypes()

    return () => {
      counterTypesMap.unobserve(updateCounterTypes)
    }
  }, [])

  const handleAddCounterType = (counterType: string) => {
    // Record this counter type in the room history
    counterTypesMap.set(counterType, true)
    // Add one counter of this type to the card
    modifyCounters(cardId, counterType, 1, playerId)
  }

  const cardStyle: React.CSSProperties = {
    width: '120px',
    height: '160px',
    border: `3px solid ${playerColor}`,
    borderRadius: '8px',
    backgroundColor: card.faceDown ? '#333' : '#fff',
    padding: '0.5rem',
    position: 'relative',
    transition: 'transform 0.3s ease',
    transform: card.tapped ? 'rotate(90deg)' : 'rotate(0deg)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }

  const cardBackStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    color: '#666',
  }

  const counterBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '5px',
    right: '5px',
    backgroundColor: '#FF5722',
    color: 'white',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  }

  const attachmentIndicatorStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '5px',
    right: '5px',
    backgroundColor: '#9C27B0',
    color: 'white',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
  }

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: 'white',
    border: '2px solid #333',
    borderRadius: '6px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
    zIndex: 100,
    minWidth: '150px',
    marginTop: '4px',
  }

  const menuItemStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    fontSize: '0.75rem',
    borderBottom: '1px solid #eee',
  }

  const totalCounters = Object.values(card.counters).reduce(
    (sum: number, count: number) => sum + count,
    0
  )

  const handleTapToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCardTapped(cardId, !card.tapped, playerId)
  }

  const handleMove = (targetZone: string, position?: 'top' | 'bottom') => {
    const targetZoneId = `${targetZone}-${playerId}`
    moveCardToZone(cardId, targetZoneId, position || 'auto', playerId)
    setShowMenu(false)
  }

  if (card.faceDown) {
    return (
      <div style={cardStyle} title={`Card ${cardId} (face down)`}>
        <div style={cardBackStyle}>🂠</div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={cardStyle}
        title={`Card ${cardId}`}
        onClick={handleTapToggle}
        onContextMenu={(e) => {
          e.preventDefault()
          setShowMenu(!showMenu)
        }}
      >
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 'bold',
            wordBreak: 'break-all',
          }}
        >
          {card.oracleId}
        </div>

        <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.25rem' }}>
          ID: {cardId.slice(0, 8)}
        </div>

        {card.tapped && (
          <div
            style={{
              fontSize: '0.7rem',
              color: '#FF5722',
              fontWeight: 'bold',
              marginTop: '0.25rem',
            }}
          >
            ⭯ TAPPED
          </div>
        )}

        {totalCounters > 0 && (
          <div style={counterBadgeStyle} title={`${totalCounters} counters`}>
            {totalCounters}
          </div>
        )}

        {card.attachments.length > 0 && (
          <div
            style={attachmentIndicatorStyle}
            title={`${card.attachments.length} attachments`}
          >
            +{card.attachments.length}
          </div>
        )}

        <div style={{ fontSize: '0.6rem', color: '#999', marginTop: 'auto' }}>
          v{card.v}
        </div>

        {/* Move button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          style={{
            position: 'absolute',
            top: '5px',
            left: '5px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid #333',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '0.7rem',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ⋮
        </button>
      </div>

      {/* Movement menu */}
      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
            }}
            onClick={() => setShowMenu(false)}
          />
          <div style={menuStyle}>
            {/* Move submenu header */}
            <div
              style={{
                ...menuItemStyle,
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onClick={(e) => {
                e.stopPropagation()
                setShowMoveSubmenu(!showMoveSubmenu)
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <span>Move to...</span>
              <span>{showMoveSubmenu ? '▼' : '▶'}</span>
            </div>

            {/* Move submenu options */}
            {showMoveSubmenu && (
              <>
                <div
                  style={{ ...menuItemStyle, paddingLeft: '1.5rem' }}
                  onClick={() => handleMove('hand')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                  }}
                >
                  → Hand
                </div>
                <div
                  style={{ ...menuItemStyle, paddingLeft: '1.5rem' }}
                  onClick={() => handleMove('battlefield')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                  }}
                >
                  → Battlefield
                </div>
                <div
                  style={{ ...menuItemStyle, paddingLeft: '1.5rem' }}
                  onClick={() => handleMove('graveyard')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                  }}
                >
                  → Graveyard
                </div>
                <div
                  style={{ ...menuItemStyle, paddingLeft: '1.5rem' }}
                  onClick={() => handleMove('exile')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                  }}
                >
                  → Exile
                </div>
                <div
                  style={{ ...menuItemStyle, paddingLeft: '1.5rem' }}
                  onClick={() => handleMove('deck', 'top')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                  }}
                >
                  → Deck (top)
                </div>
                <div
                  style={{ ...menuItemStyle, paddingLeft: '1.5rem' }}
                  onClick={() => handleMove('deck', 'bottom')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                  }}
                >
                  → Deck (bottom)
                </div>
              </>
            )}

            {/* Counters Section */}
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
              COUNTERS
            </div>

            {/* List existing counters */}
            {Object.entries(card.counters).map(([type, count]) => (
              <div
                key={type}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 'bold' }}>
                  {type}: {count}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      modifyCounters(cardId, type, 1, playerId)
                    }}
                    style={{
                      padding: '2px 6px',
                      fontSize: '0.7rem',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    +1
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      modifyCounters(cardId, type, -1, playerId)
                    }}
                    style={{
                      padding: '2px 6px',
                      fontSize: '0.7rem',
                      backgroundColor: '#F44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    -1
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setCounterModal({ type: 'set', counterType: type })
                      setShowMenu(false)
                    }}
                    style={{
                      padding: '2px 6px',
                      fontSize: '0.7rem',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Set
                  </button>
                </div>
              </div>
            ))}

            {/* Quick Add Section */}
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
              QUICK ADD
            </div>

            <div
              style={{
                padding: '0.5rem 0.75rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                borderBottom: '1px solid #eee',
              }}
            >
              {/* Always show +1/+1 and Loyalty */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddCounterType('+1/+1')
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                +1/+1
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddCounterType('Loyalty')
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  backgroundColor: '#9C27B0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Loyalty
              </button>

              {/* Show previously used counter types (excluding the presets) */}
              {knownCounterTypes
                .filter((type) => type !== '+1/+1' && type !== 'Loyalty')
                .map((type) => (
                  <button
                    key={type}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddCounterType(type)
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    {type}
                  </button>
                ))}

              {/* Custom button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCounterModal({ type: 'add' })
                  setShowMenu(false)
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  backgroundColor: '#757575',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Custom...
              </button>
            </div>
          </div>
        </>
      )}

      {/* Counter Modals */}
      {counterModal?.type === 'set' && counterModal.counterType && (
        <NumberInputModal
          title={`Set ${counterModal.counterType} counters`}
          max={99}
          onConfirm={(value) => {
            const current = card.counters[counterModal.counterType!] || 0
            modifyCounters(cardId, counterModal.counterType!, value - current, playerId)
            setCounterModal(null)
          }}
          onCancel={() => setCounterModal(null)}
        />
      )}

      {counterModal?.type === 'add' && (
        <TextInputModal
          title="Add Counter Type"
          placeholder="e.g., +1/+1, Loyalty, Charge"
          onConfirm={(counterType) => {
            modifyCounters(cardId, counterType, 1, playerId)
            setCounterModal(null)
          }}
          onCancel={() => setCounterModal(null)}
        />
      )}
    </div>
  )
}
