import { useState } from 'react'
import { Card } from './store'
import { useCardImage } from './hooks/useCardImage'

interface ScryPeekModalProps {
  cards: Array<{ cardId: string; card: Card }>
  mode: 'scry' | 'peek'
  onConfirm?: (topCardIds: string[], bottomCardIds: string[]) => void
  onCancel: () => void
}

export function ScryPeekModal({ cards, mode, onConfirm, onCancel }: ScryPeekModalProps) {
  const [topCards, setTopCards] = useState<string[]>(cards.map(c => c.cardId))
  const [bottomCards, setBottomCards] = useState<string[]>([])

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
          {mode === 'scry' ? 'Scry' : 'Peek'} {cards.length}
        </h2>

        {mode === 'scry' && (
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#666' }}>
            Reorder cards and choose which to put on top or bottom of your deck
          </p>
        )}

        {/* Top of Deck Section */}
        {topCards.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#333' }}>
              Top of Deck ({topCards.length})
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              {topCards.map((cardId, index) => {
                const cardData = cards.find(c => c.cardId === cardId)
                if (!cardData) return null
                return (
                  <CardDisplay
                    key={cardId}
                    cardId={cardId}
                    card={cardData.card}
                    position={index + 1}
                    canMoveUp={mode === 'scry' && index > 0}
                    canMoveDown={mode === 'scry' && index < topCards.length - 1}
                    onMoveUp={() => handleReorder(cardId, 'up', 'top')}
                    onMoveDown={() => handleReorder(cardId, 'down', 'top')}
                    onMoveToBottom={mode === 'scry' ? () => handleMoveToBottom(cardId) : undefined}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Bottom of Deck Section */}
        {mode === 'scry' && bottomCards.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#333' }}>
              Bottom of Deck ({bottomCards.length})
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              {bottomCards.map((cardId, index) => {
                const cardData = cards.find(c => c.cardId === cardId)
                if (!cardData) return null
                return (
                  <CardDisplay
                    key={cardId}
                    cardId={cardId}
                    card={cardData.card}
                    position={index + 1}
                    canMoveUp={index > 0}
                    canMoveDown={index < bottomCards.length - 1}
                    onMoveUp={() => handleReorder(cardId, 'up', 'bottom')}
                    onMoveDown={() => handleReorder(cardId, 'down', 'bottom')}
                    onMoveToTop={() => handleMoveToTop(cardId)}
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
}

function CardDisplay({
  card,
  position,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onMoveToBottom,
  onMoveToTop,
}: CardDisplayProps) {
  const { imageUrl, loading } = useCardImage(card.oracleId)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'center',
      }}
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
        {/* Position Badge */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
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
    </div>
  )
}
