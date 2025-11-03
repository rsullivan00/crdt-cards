import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Card, moveCardToZone } from './store'
import { useCardImage } from './hooks/useCardImage'

interface ScryPeekModalProps {
  cards: Array<{ cardId: string; card: Card }>
  mode: 'scry' | 'peek'
  playerId?: string
  onConfirm?: (topCardIds: string[], bottomCardIds: string[]) => void
  onCancel: () => void
}

export function ScryPeekModal({ cards, mode, playerId, onConfirm, onCancel }: ScryPeekModalProps) {
  const [topCards, setTopCards] = useState<string[]>(cards.map(c => c.cardId))
  const [bottomCards, setBottomCards] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())

  const handleMoveToBottom = (cardId: string) => {
    setTopCards(prev => prev.filter(id => id !== cardId))
    setBottomCards(prev => [...prev, cardId])
  }

  const handleMoveToTop = (cardId: string) => {
    setBottomCards(prev => prev.filter(id => id !== cardId))
    setTopCards(prev => [...prev, cardId])
  }

  const handleReorder = (cardId: string, direction: 'up' | 'down', list: 'top' | 'bottom') => {
    const setter = list === 'top' ? setTopCards : setBottomCards
    setter(prev => {
      const index = prev.indexOf(cardId)
      if (index === -1) return prev

      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= prev.length) return prev

      const newOrder = [...prev]
      ;[newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]]
      return newOrder
    })
  }

  const handleConfirm = () => {
    if (mode === 'scry' && onConfirm) {
      onConfirm(topCards, bottomCards)
    }
    onCancel()
  }

  // Filter cards based on search term
  const getCardName = (cardId: string): string => {
    const cardData = cards.find(c => c.cardId === cardId)
    if (!cardData) return ''
    return cardData.card.metadata?.name || cardData.card.oracleId
  }

  const filteredTopCards = topCards.filter(cardId => {
    const name = getCardName(cardId).toLowerCase()
    return name.includes(searchTerm.toLowerCase())
  })

  const filteredBottomCards = bottomCards.filter(cardId => {
    const name = getCardName(cardId).toLowerCase()
    return name.includes(searchTerm.toLowerCase())
  })

  const handleCardClick = (cardId: string, e: React.MouseEvent) => {
    // Only handle Ctrl/Cmd+click for multi-selection
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation()
      setSelectedCards(prev => {
        const newSet = new Set(prev)
        if (newSet.has(cardId)) {
          newSet.delete(cardId)
        } else {
          newSet.add(cardId)
        }
        return newSet
      })
    }
  }

  const handleCardMoved = (cardId: string) => {
    // Remove the moved card from the modal's local state
    setTopCards(prev => prev.filter(id => id !== cardId))
    setBottomCards(prev => prev.filter(id => id !== cardId))
    setSelectedCards(prev => {
      const newSet = new Set(prev)
      newSet.delete(cardId)
      return newSet
    })
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
        zIndex: 10000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
          {mode === 'scry' ? 'Scry' : 'View'} {cards.length}
        </h2>

        {mode === 'peek' && (
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#666' }}>
            Search for cards and use the menu on each card to move them. Ctrl+click to select multiple cards.
          </p>
        )}

        {mode === 'scry' && (
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#666' }}>
            Reorder cards and choose which to put on top or bottom of your deck
          </p>
        )}

        {/* Search Box */}
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search by card name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '0.9rem',
              border: '2px solid #ccc',
              borderRadius: '6px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Top of Deck Section */}
        {filteredTopCards.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#333' }}>
              Top of Deck ({topCards.length}{searchTerm ? `, showing ${filteredTopCards.length}` : ''})
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              {filteredTopCards.map((cardId) => {
                const cardData = cards.find(c => c.cardId === cardId)
                if (!cardData) return null
                const actualIndex = topCards.indexOf(cardId)
                return (
                  <CardDisplay
                    key={cardId}
                    cardId={cardId}
                    card={cardData.card}
                    position={actualIndex + 1}
                    canMoveUp={mode === 'scry' && actualIndex > 0}
                    canMoveDown={mode === 'scry' && actualIndex < topCards.length - 1}
                    onMoveUp={() => handleReorder(cardId, 'up', 'top')}
                    onMoveDown={() => handleReorder(cardId, 'down', 'top')}
                    onMoveToBottom={mode === 'scry' ? () => handleMoveToBottom(cardId) : undefined}
                    isSelected={selectedCards.has(cardId)}
                    onClick={(e) => handleCardClick(cardId, e)}
                    playerId={playerId}
                    mode={mode}
                    onCardMoved={handleCardMoved}
                    selectedCards={selectedCards}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Bottom of Deck Section */}
        {mode === 'scry' && filteredBottomCards.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#333' }}>
              Bottom of Deck ({bottomCards.length}{searchTerm ? `, showing ${filteredBottomCards.length}` : ''})
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              {filteredBottomCards.map((cardId) => {
                const cardData = cards.find(c => c.cardId === cardId)
                if (!cardData) return null
                const actualIndex = bottomCards.indexOf(cardId)
                return (
                  <CardDisplay
                    key={cardId}
                    cardId={cardId}
                    card={cardData.card}
                    position={actualIndex + 1}
                    canMoveUp={actualIndex > 0}
                    canMoveDown={actualIndex < bottomCards.length - 1}
                    onMoveUp={() => handleReorder(cardId, 'up', 'bottom')}
                    onMoveDown={() => handleReorder(cardId, 'down', 'bottom')}
                    onMoveToTop={() => handleMoveToTop(cardId)}
                    isSelected={selectedCards.has(cardId)}
                    onClick={(e) => handleCardClick(cardId, e)}
                    playerId={playerId}
                    mode={mode}
                    onCardMoved={handleCardMoved}
                    selectedCards={selectedCards}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ccc',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {mode === 'peek' ? 'Close' : 'Cancel'}
          </button>
          {mode === 'scry' && (
            <button
              onClick={handleConfirm}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface CardDisplayProps {
  cardId: string
  card: Card
  position: number
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onMoveToBottom?: () => void
  onMoveToTop?: () => void
  isSelected?: boolean
  onClick?: (e: React.MouseEvent) => void
  playerId?: string
  mode: 'scry' | 'peek'
  onCardMoved?: (cardId: string) => void
  selectedCards?: Set<string>
}

function CardDisplay({
  cardId,
  card,
  position,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onMoveToBottom,
  onMoveToTop,
  isSelected = false,
  onClick,
  playerId,
  mode,
  onCardMoved,
  selectedCards = new Set(),
}: CardDisplayProps) {
  const { imageUrl, loading } = useCardImage(card.oracleId)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    
    if (!showMenu && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      // Calculate position - place to the right of button
      let left = rect.right + 8
      let top = rect.top

      // If menu would go off right edge, place to the left instead
      const menuWidth = 180
      if (left + menuWidth > viewportWidth) {
        left = rect.left - menuWidth - 8
      }

      // If menu would go off bottom, adjust upward
      const menuHeight = 200
      if (top + menuHeight > viewportHeight) {
        top = Math.max(8, viewportHeight - menuHeight - 8)
      }

      setMenuPosition({ top, left })
    }
    setShowMenu(!showMenu)
  }

  const handleMoveToZone = (targetZone: string, position?: 'top' | 'bottom') => {
    if (!playerId) return
    const targetZoneId = `${targetZone}-${playerId}`
    
    // If this card is selected and there are multiple selections, move all of them
    if (isSelected && selectedCards.size > 1) {
      selectedCards.forEach(selectedCardId => {
        moveCardToZone(selectedCardId, targetZoneId, position || 'auto', playerId)
        // Notify parent that each card was moved
        if (onCardMoved) {
          onCardMoved(selectedCardId)
        }
      })
    } else {
      // Move just this card
      moveCardToZone(cardId, targetZoneId, position || 'auto', playerId)
      // Notify parent that card was moved
      if (onCardMoved) {
        onCardMoved(cardId)
      }
    }
    
    setShowMenu(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'center',
      }}
      onClick={onClick}
    >
      {/* Card Image */}
      <div
        style={{
          width: '150px',
          height: '210px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid #333',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          outline: isSelected ? '4px solid #2196F3' : 'none',
          outlineOffset: '-4px',
          boxShadow: isSelected ? '0 0 12px rgba(33, 150, 243, 0.8)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {loading ? (
          <div style={{ fontSize: '0.8rem', color: '#999' }}>Loading...</div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={card.oracleId}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              padding: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textAlign: 'center',
              wordBreak: 'break-word',
            }}
          >
            {card.oracleId}
          </div>
        )}
        
        {/* Menu button - only show in peek mode */}
        {mode === 'peek' && playerId && (
          <button
            onClick={handleMenuClick}
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
        
        {/* Position Badge - moved below menu button */}
        <div
          style={{
            position: 'absolute',
            top: mode === 'peek' && playerId ? '35px' : '8px',
            left: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}
        >
          {position}
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {canMoveUp && (
          <button
            onClick={onMoveUp}
            style={{
              padding: '4px 8px',
              fontSize: '0.75rem',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ▲
          </button>
        )}
        {canMoveDown && (
          <button
            onClick={onMoveDown}
            style={{
              padding: '4px 8px',
              fontSize: '0.75rem',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ▼
          </button>
        )}
        {onMoveToBottom && (
          <button
            onClick={onMoveToBottom}
            style={{
              padding: '4px 8px',
              fontSize: '0.7rem',
              backgroundColor: '#F44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            To Bottom
          </button>
        )}
        {onMoveToTop && (
          <button
            onClick={onMoveToTop}
            style={{
              padding: '4px 8px',
              fontSize: '0.7rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            To Top
          </button>
        )}
      </div>

      {/* Menu - rendered via portal */}
      {mode === 'peek' && playerId && showMenu && createPortal(
        <>
          {/* Backdrop to close menu */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10998,
            }}
            onClick={() => setShowMenu(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: menuPosition ? `${menuPosition.top}px` : '50%',
              left: menuPosition ? `${menuPosition.left}px` : '50%',
              transform: menuPosition ? 'none' : 'translate(-50%, -50%)',
              backgroundColor: 'white',
              border: '2px solid #333',
              borderRadius: '6px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              zIndex: 10999,
              minWidth: '150px',
            }}
          >
            <div
              style={{
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                borderBottom: '1px solid #eee',
              }}
              onClick={() => handleMoveToZone('hand')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              → Hand
              {isSelected && selectedCards.size > 1 && (
                <span style={{
                  marginLeft: '6px',
                  color: '#2196F3',
                  fontWeight: 'bold',
                  fontSize: '0.9em'
                }}>
                  ({selectedCards.size} cards)
                </span>
              )}
            </div>
            <div
              style={{
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                borderBottom: '1px solid #eee',
              }}
              onClick={() => handleMoveToZone('battlefield')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              → Battlefield
              {isSelected && selectedCards.size > 1 && (
                <span style={{
                  marginLeft: '6px',
                  color: '#2196F3',
                  fontWeight: 'bold',
                  fontSize: '0.9em'
                }}>
                  ({selectedCards.size} cards)
                </span>
              )}
            </div>
            <div
              style={{
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                borderBottom: '1px solid #eee',
              }}
              onClick={() => handleMoveToZone('graveyard')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              → Graveyard
              {isSelected && selectedCards.size > 1 && (
                <span style={{
                  marginLeft: '6px',
                  color: '#2196F3',
                  fontWeight: 'bold',
                  fontSize: '0.9em'
                }}>
                  ({selectedCards.size} cards)
                </span>
              )}
            </div>
            <div
              style={{
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                borderBottom: '1px solid #eee',
              }}
              onClick={() => handleMoveToZone('exile')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              → Exile
              {isSelected && selectedCards.size > 1 && (
                <span style={{
                  marginLeft: '6px',
                  color: '#2196F3',
                  fontWeight: 'bold',
                  fontSize: '0.9em'
                }}>
                  ({selectedCards.size} cards)
                </span>
              )}
            </div>
            <div
              style={{
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                borderBottom: '1px solid #eee',
              }}
              onClick={() => handleMoveToZone('deck', 'top')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              → Deck (top)
              {isSelected && selectedCards.size > 1 && (
                <span style={{
                  marginLeft: '6px',
                  color: '#2196F3',
                  fontWeight: 'bold',
                  fontSize: '0.9em'
                }}>
                  ({selectedCards.size} cards)
                </span>
              )}
            </div>
            <div
              style={{
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                borderBottom: 'none',
              }}
              onClick={() => handleMoveToZone('deck', 'bottom')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              → Deck (bottom)
              {isSelected && selectedCards.size > 1 && (
                <span style={{
                  marginLeft: '6px',
                  color: '#2196F3',
                  fontWeight: 'bold',
                  fontSize: '0.9em'
                }}>
                  ({selectedCards.size} cards)
                </span>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
