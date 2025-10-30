import { useState, useEffect } from 'react'
import { Card as CardType, moveCardToZone, setCardTapped, modifyCounters, counterTypesMap } from './store'
import { NumberInputModal } from './NumberInputModal'
import { TextInputModal } from './TextInputModal'
import { useCardImage } from './hooks/useCardImage'

// Module-level variable to track if any card is being dragged
let isDraggingAnyCard = false

// Callback to update zones when drag state changes
let onDragStateChange: (() => void) | null = null

// Export function to check if dragging
export const getIsDragging = () => isDraggingAnyCard

// Export function to set drag state change callback
export const setDragStateChangeCallback = (callback: (() => void) | null) => {
  onDragStateChange = callback
}

interface CardProps {
  card: CardType;
  cardId: string;
  playerId: string;
  isInteractive?: boolean;
  forceFaceDown?: boolean;
}

export function Card({
  card,
  cardId,
  playerId,
  isInteractive = true,
  forceFaceDown = false,
}: CardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false)
  const [counterModal, setCounterModal] = useState<{
    type: 'set' | 'add'
    counterType?: string
  } | null>(null)
  const [knownCounterTypes, setKnownCounterTypes] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const cardIsFaceDown = forceFaceDown || card.faceDown

  // Fetch card image from Scryfall (only if not face down)
  const { imageUrl, loading: imageLoading } = useCardImage(
    cardIsFaceDown ? '' : card.oracleId
  )

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
    border: 'none',
    borderRadius: '8px',
    backgroundColor: cardIsFaceDown ? '#333' : '#fff',
    padding: '0.5rem',
    position: 'relative',
    transition: 'transform 0.3s ease',
    transform: card.tapped ? 'rotate(90deg)' : 'rotate(0deg)',
    cursor: isInteractive ? 'pointer' : 'default',
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
    if (!isInteractive) return
    e.stopPropagation()
    setCardTapped(cardId, !card.tapped, playerId)
  }

  const handleMove = (targetZone: string, position?: 'top' | 'bottom') => {
    const targetZoneId = `${targetZone}-${playerId}`
    moveCardToZone(cardId, targetZoneId, position || 'auto', playerId)
    setShowMenu(false)
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (!isInteractive) {
      e.preventDefault()
      return
    }
    setIsDragging(true)
    isDraggingAnyCard = true
    onDragStateChange?.()

    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('cardId', cardId)
    e.dataTransfer.setData('fromZoneId', card.zoneId)
    e.dataTransfer.setData('playerId', playerId)
    e.dataTransfer.setData('order', card.order.toString())
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    isDraggingAnyCard = false
    onDragStateChange?.()
  }

  // Removed old drag over/drop handlers - will use grid-based drop targets in Zone instead

  if (cardIsFaceDown) {
    return (
      <div style={cardStyle} title={`Card ${cardId} (face down)`}>
        <div style={cardBackStyle}>🂠</div>
      </div>
    )
  }

  return (
    <div
      style={{ position: 'relative' }}
      data-card-id={cardId}
      data-order={card.order}
      data-zone-id={card.zoneId}
    >
      <div
        style={{
          ...cardStyle,
          padding: 0, // Remove padding for image
          overflow: 'hidden',
          opacity: isDragging ? 0.5 : 1,
          cursor: isInteractive ? 'grab' : 'default',
        }}
        title={card.oracleId}
        draggable={isInteractive}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleTapToggle}
        onContextMenu={(e) => {
          if (!isInteractive) return
          e.preventDefault()
          setShowMenu(!showMenu)
        }}
      >
        {/* Card Image or Loading/Error State */}
        {imageLoading ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              color: '#999',
            }}
          >
            Loading...
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={card.oracleId}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '5px',
            }}
          />
        ) : (
          // Fallback: Show text if image fails to load
          <div
            style={{
              width: '100%',
              height: '100%',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
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
            <div style={{ fontSize: '0.65rem', color: '#666' }}>
              No image
            </div>
          </div>
        )}

        {/* Overlays */}
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

        {card.tapped && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(255, 87, 34, 0.9)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              pointerEvents: 'none',
            }}
          >
            ⭯ TAPPED
          </div>
        )}

        {/* Move button */}
        {isInteractive && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            style={{
              position: 'absolute',
              top: '5px',
              left: '5px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.7rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          >
            ⋮
          </button>
        )}
      </div>

      {/* Movement menu */}
      {isInteractive && showMenu && (
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
      {isInteractive && counterModal?.type === 'set' && counterModal.counterType && (
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

      {isInteractive && counterModal?.type === 'add' && (
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
