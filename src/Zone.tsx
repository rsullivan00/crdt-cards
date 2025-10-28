import { useState, useEffect, useRef } from 'react'
import { Card as CardComponent, getIsDragging, setDragStateChangeCallback } from './Card'
import { Card as CardType, moveCardToZone } from './store'
import { NumberInputModal } from './NumberInputModal'
import { DropTarget } from './DropTarget'

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
}: ZoneProps) {
  const [numberModal, setNumberModal] = useState<{
    title: string
    onConfirm: (value: number) => void
  } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isAnyCardDragging, setIsAnyCardDragging] = useState(false)
  const zoneRef = useRef<HTMLDivElement>(null)

  // Subscribe to global drag state changes
  useEffect(() => {
    const updateDragState = () => {
      setIsAnyCardDragging(getIsDragging())
    }

    setDragStateChangeCallback(updateDragState)
    return () => {
      setDragStateChangeCallback(null)
    }
  }, [])

  // Constants for grid calculation
  const CARD_WIDTH = 120
  const CARD_GAP = 16
  const SLOT_WIDTH = CARD_WIDTH + CARD_GAP

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

    // Don't do anything if dropping in the same zone (reordering handled separately)
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

  // Regular zones (hand, battlefield, graveyard, exile)
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

      <div
        ref={zoneRef}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          minHeight: '160px',
          alignItems: 'flex-start',
        }}
      >
        {isAnyCardDragging ? (
          // Show cards with drop targets between them when dragging
          (() => {
            // Sort cards by order
            const sortedCards = [...cards].sort((a, b) => a.card.order - b.card.order)

            if (sortedCards.length === 0) {
              // Empty zone - show single drop target
              return (
                <DropTarget
                  key="drop-empty"
                  slotIndex={0}
                  zoneId={zoneId}
                  playerId={playerId}
                  insertBeforeCardId={null}
                />
              )
            }

            // Render cards with drop targets between them
            const elements = []

            // Drop target before first card
            elements.push(
              <DropTarget
                key="drop-start"
                slotIndex={0}
                zoneId={zoneId}
                playerId={playerId}
                insertBeforeCardId={sortedCards[0].id}
              />
            )

            // Render each card followed by a drop target
            sortedCards.forEach((cardData, index) => {
              const shouldHideCard =
                zoneType === 'hand' &&
                !!viewerPlayerId &&
                playerId !== viewerPlayerId

              // Render the card
              elements.push(
                <CardComponent
                  key={cardData.id}
                  cardId={cardData.id}
                  card={cardData.card}
                  playerColor={playerColor}
                  playerId={playerId}
                  isInteractive={isInteractive}
                  forceFaceDown={shouldHideCard}
                />
              )

              // Render drop target after this card (except after the last card, we'll handle that separately)
              if (index < sortedCards.length - 1) {
                elements.push(
                  <DropTarget
                    key={`drop-${index}`}
                    slotIndex={index + 1}
                    zoneId={zoneId}
                    playerId={playerId}
                    insertBeforeCardId={sortedCards[index + 1].id}
                  />
                )
              }
            })

            // Drop target after last card
            elements.push(
              <DropTarget
                key="drop-end"
                slotIndex={sortedCards.length}
                zoneId={zoneId}
                playerId={playerId}
                insertBeforeCardId={null}
              />
            )

            return elements
          })()
        ) : (
          // Normal rendering when not dragging
          cards.length === 0 ? (
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
                  playerColor={playerColor}
                  playerId={playerId}
                  isInteractive={isInteractive}
                  forceFaceDown={shouldHideCard}
                />
              )
            })
          )
        )}
      </div>
    </div>
  )
}
