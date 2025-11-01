import { useState, useRef } from 'react'
import { Card as CardComponent } from './Card'
import { Card as CardType, moveCardToZone, setCardPosition } from './store'
import { NumberInputModal } from './NumberInputModal'

interface ZoneProps {
  zoneName: string
  zoneType: string
  cards: Array<{ id: string; card: CardType }>
  playerColor: string
  playerId: string
  onDrawCards?: (count: number) => void
  onMillCards?: (count: number) => void
  onExileFromDeck?: (count: number) => void
  onShuffleDeck?: () => void
  isInteractive?: boolean
  viewerPlayerId?: string
  zoneId: string
  showHeader?: boolean
}

export function Zone({
  zoneName,
  zoneType,
  cards,
  playerColor,
  playerId,
  onDrawCards,
  onMillCards,
  onExileFromDeck,
  onShuffleDeck,
  isInteractive = true,
  viewerPlayerId,
  zoneId,
  showHeader = true,
}: ZoneProps) {
  const [numberModal, setNumberModal] = useState<{
    title: string
    onConfirm: (value: number) => void
  } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const battlefieldRef = useRef<HTMLDivElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const cardId = e.dataTransfer.getData('cardId')
    const fromZoneId = e.dataTransfer.getData('fromZoneId')
    const dragPlayerId = e.dataTransfer.getData('playerId')

    // Only allow dropping your own cards
    if (dragPlayerId !== playerId) {
      console.log('Cannot drop opponent cards')
      return
    }

    // For battlefield zone, calculate drop position
    if (zoneType === 'battlefield' && battlefieldRef.current) {
      const rect = battlefieldRef.current.getBoundingClientRect()

      // Get the drag offset (where on the card the user clicked)
      const offsetX = parseFloat(e.dataTransfer.getData('dragOffsetX') || '0')
      const offsetY = parseFloat(e.dataTransfer.getData('dragOffsetY') || '0')

      // Calculate position accounting for where the user grabbed the card
      // This makes the card appear exactly where the drag preview showed it
      const x = e.clientX - rect.left - offsetX
      const y = e.clientY - rect.top - offsetY

      // If dropping from a different zone, move card first then set position
      if (fromZoneId !== zoneId) {
        moveCardToZone(cardId, zoneId, 'auto', playerId)
      }

      // Set the position (this will also update if already in battlefield)
      setCardPosition(cardId, x, y, playerId)
      return
    }

    // For other zones, don't do anything if dropping in the same zone
    if (fromZoneId === zoneId) {
      return
    }

    // Move card to this zone
    moveCardToZone(cardId, zoneId, 'auto', playerId)
  }

  // Deck zone gets special rendering
  if (zoneType === 'deck') {
    return (
      <div
        style={{
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>
            {zoneName}
          </h3>
          <span
            style={{
              backgroundColor: playerColor,
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            {cards.length} cards
          </span>
        </div>

        {/* Deck visual representation */}
        <div
          style={{
            backgroundColor: '#333',
            border: '2px solid #666',
            borderRadius: '8px',
            padding: '2rem 1rem',
            textAlign: 'center',
            color: 'white',
            marginBottom: '0.75rem',
            fontSize: '2rem',
          }}
        >
          🃏
        </div>

        {/* Deck actions */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <button
            onClick={() => onDrawCards?.(1)}
            disabled={cards.length === 0}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: cards.length > 0 ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: cards.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            Draw 1
          </button>
          <button
            onClick={() =>
              setNumberModal({
                title: 'Draw how many cards?',
                onConfirm: (n) => {
                  onDrawCards?.(n)
                  setNumberModal(null)
                },
              })
            }
            disabled={cards.length === 0}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: cards.length > 0 ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: cards.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            Draw N
          </button>
          <button
            onClick={() => onMillCards?.(1)}
            disabled={cards.length === 0}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: cards.length > 0 ? '#FF9800' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: cards.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            Mill 1
          </button>
          <button
            onClick={() =>
              setNumberModal({
                title: 'Mill how many cards?',
                onConfirm: (n) => {
                  onMillCards?.(n)
                  setNumberModal(null)
                },
              })
            }
            disabled={cards.length === 0}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: cards.length > 0 ? '#FF9800' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: cards.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            Mill N
          </button>
          <button
            onClick={() => onExileFromDeck?.(1)}
            disabled={cards.length === 0}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: cards.length > 0 ? '#9C27B0' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: cards.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            Exile 1
          </button>
          <button
            onClick={() => onShuffleDeck?.()}
            disabled={cards.length === 0}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              backgroundColor: cards.length > 0 ? '#2196F3' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: cards.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            Shuffle
          </button>
        </div>

        {numberModal && (
          <NumberInputModal
            title={numberModal.title}
            max={cards.length}
            onConfirm={numberModal.onConfirm}
            onCancel={() => setNumberModal(null)}
          />
        )}
      </div>
    )
  }

  // Battlefield zone with absolute positioning
  if (zoneType === 'battlefield') {
    return (
      <div
        style={{
          backgroundColor: isDragOver ? '#e3f2fd' : '#f5f5f5',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          minHeight: '400px',
          border: isDragOver ? '2px dashed #2196F3' : '2px solid transparent',
          transition: 'all 0.2s ease',
          position: 'relative', // Important for absolute positioning of cards
        }}
        data-zone-id={zoneId}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>
            {zoneName}
          </h3>
          <span
            style={{
              backgroundColor: playerColor,
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            {cards.length} cards
          </span>
        </div>

        {/* Battlefield cards with absolute positioning */}
        <div
          ref={battlefieldRef}
          style={{
            position: 'relative',
            minHeight: '340px',
          }}
        >
          {cards.length === 0 ? (
            <div
              style={{
                color: '#999',
                fontStyle: 'italic',
                fontSize: '0.875rem',
                padding: '1rem',
              }}
            >
              No cards on battlefield
            </div>
          ) : (
            cards.map(({ id, card }) => (
              <CardComponent
                key={id}
                cardId={id}
                card={card}
                playerId={playerId}
                isInteractive={isInteractive}
                forceFaceDown={false}
              />
            ))
          )}
        </div>
      </div>
    )
  }

  // Regular zones (hand, graveyard, exile) with flex layout
  return (
    <div
      style={{
        backgroundColor: isDragOver ? '#e3f2fd' : '#f5f5f5',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
        minHeight: '200px',
        border: isDragOver ? '2px dashed #2196F3' : '2px solid transparent',
        transition: 'all 0.2s ease',
      }}
      data-zone-id={zoneId}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {showHeader && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>
            {zoneName}
          </h3>
          <span
            style={{
              backgroundColor: playerColor,
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            {cards.length} cards
          </span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          minHeight: '160px',
          alignItems: 'flex-start',
        }}
      >
        {cards.length === 0 ? (
          <div
            style={{
              color: '#999',
              fontStyle: 'italic',
              fontSize: '0.875rem',
              padding: '1rem',
            }}
          >
            No cards in this zone
          </div>
        ) : (
          cards.map(({ id, card }) => {
            const shouldHideCard =
              zoneType === 'hand' &&
              !!viewerPlayerId &&
              playerId !== viewerPlayerId

            return (
              <CardComponent
                key={id}
                cardId={id}
                card={card}

                playerId={playerId}
                isInteractive={isInteractive}
                forceFaceDown={shouldHideCard}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
