import { useState, useRef, useEffect } from 'react'
import { Card as CardComponent } from './Card'
import { Card as CardType, moveCardToZoneUndoable, setCardPosition, selectCards, clearSelection } from './store'
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
  opponentPosition?: 'top' | 'left' | 'right' | null
  cardSize?: 'compact' | 'large'
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
  opponentPosition = null,
  cardSize = 'compact',
}: ZoneProps) {
  const [numberModal, setNumberModal] = useState<{
    title: string
    onConfirm: (value: number) => void
  } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null)
  const [autoZoomTransform, setAutoZoomTransform] = useState('none')
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const battlefieldRef = useRef<HTMLDivElement>(null)

  // Auto-zoom for opponent battlefields
  const isOpponentBattlefield = zoneType === 'battlefield' && viewerPlayerId && playerId !== viewerPlayerId

  // Observe container size changes
  useEffect(() => {
    if (!battlefieldRef.current) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    observer.observe(battlefieldRef.current)
    return () => observer.disconnect()
  }, [])

  // Calculate card dimensions based on size
  const cardWidth = cardSize === 'compact' ? 122 : 244
  const cardHeight = cardSize === 'compact' ? 170 : 340

  // Calculate auto-zoom scale
  useEffect(() => {
    if (!isOpponentBattlefield || cards.length === 0 || containerSize.width === 0) {
      setAutoZoomTransform('none')
      return
    }

    // Calculate bounding box of all cards
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    cards.forEach(({ card }) => {
      const x = card.position?.x || 0
      const y = card.position?.y || 0
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + cardWidth)
      maxY = Math.max(maxY, y + cardHeight)
    })

    // Add padding
    const padding = 40
    const contentWidth = maxX - minX + padding * 2
    const contentHeight = maxY - minY + padding * 2

    // Calculate center of content in absolute coordinates
    const contentCenterX = (minX + maxX) / 2
    const contentCenterY = (minY + maxY) / 2

    // Use the actual observed container dimensions
    const containerWidth = containerSize.width
    const containerHeight = containerSize.height

    // Calculate scale to fit (min 0.25, max 1.0)
    const scaleX = containerWidth / contentWidth
    const scaleY = containerHeight / contentHeight
    const scale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 1.0)

    // Calculate translation to center the content
    // After scaling, we want the content center to align with the container center
    const containerCenterX = containerWidth / 2
    const containerCenterY = containerHeight / 2

    let translateX = containerCenterX - contentCenterX * scale
    const translateY = containerCenterY - contentCenterY * scale

    // If we're going to flip horizontally, adjust translateX
    // With transformOrigin '0 0' and transforms applied right-to-left:
    // translate(X,Y) scale(S) scaleX(-1) means: flip, then scale, then translate
    // After scaleX(-1) around origin 0,0: position x becomes -x
    // After scaling: -x becomes -x * scale
    // After translating: position becomes translateX + (-x * scale)
    // We want: containerCenterX = translateX + (-contentCenterX * scale)
    // Solving: translateX = containerCenterX + contentCenterX * scale
    if (opponentPosition === 'top') {
      translateX = containerCenterX + contentCenterX * scale
    }

    // Combine scale and translate (scaleX will be added in the style if needed)
    const baseTransform = `translate(${translateX}px, ${translateY}px) scale(${scale})`
    const flipTransform = opponentPosition === 'top' ? `${baseTransform} scaleX(-1)` : baseTransform
    setAutoZoomTransform(flipTransform)
  }, [isOpponentBattlefield, cards, playerId, viewerPlayerId, containerSize])


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
    const selectedCardsData = e.dataTransfer.getData('selectedCards')

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
      const baseX = e.clientX - rect.left - offsetX
      const baseY = e.clientY - rect.top - offsetY

      // Check if we're dragging multiple selected cards
      if (selectedCardsData) {
        try {
          const selectedCards: { id: string; relativeX: number; relativeY: number }[] = JSON.parse(selectedCardsData)

          // Check if cards are from battlefield (have meaningful relative positions)
          // or from other zones (all relative positions are 0)
          const fromBattlefield = selectedCards.some(({ relativeX, relativeY }) =>
            relativeX !== 0 || relativeY !== 0
          )

          if (fromBattlefield) {
            // Move all selected cards maintaining their relative positions
            selectedCards.forEach(({ id, relativeX, relativeY }) => {
              // If dropping from a different zone, move card first
              const cardFromZone = e.dataTransfer.getData('fromZoneId')
              if (cardFromZone !== zoneId) {
                moveCardToZoneUndoable(id, zoneId, 'auto', playerId)
              }

              // Set position with relative offset
              setCardPosition(id, baseX + relativeX, baseY + relativeY, playerId)
            })
          } else {
            // Cards from other zones - arrange in a grid
            const cardWidth = 120
            const cardHeight = 160
            const gap = 10
            const cardsPerRow = 5

            selectedCards.forEach(({ id }, index) => {
              // If dropping from a different zone, move card first
              const cardFromZone = e.dataTransfer.getData('fromZoneId')
              if (cardFromZone !== zoneId) {
                moveCardToZoneUndoable(id, zoneId, 'auto', playerId)
              }

              // Calculate grid position
              const col = index % cardsPerRow
              const row = Math.floor(index / cardsPerRow)
              const x = baseX + col * (cardWidth + gap)
              const y = baseY + row * (cardHeight + gap)

              setCardPosition(id, x, y, playerId)
            })
          }

          // Keep selection active for additional operations
          return
        } catch (err) {
          console.error('Failed to parse selected cards data:', err)
          // Fall through to single card handling
        }
      }

      // Single card handling (no selection)
      // If dropping from a different zone, move card first then set position
      if (fromZoneId !== zoneId) {
        moveCardToZoneUndoable(cardId, zoneId, 'auto', playerId)
      }

      // Set the position (this will also update if already in battlefield)
      setCardPosition(cardId, baseX, baseY, playerId)
      return
    }

    // For other zones (non-battlefield)
    // Check if we're dragging multiple selected cards
    if (selectedCardsData) {
      try {
        const selectedCards: { id: string; relativeX: number; relativeY: number }[] = JSON.parse(selectedCardsData)

        // Don't do anything if dropping in the same zone
        if (fromZoneId !== zoneId) {
          // Move all selected cards to this zone
          selectedCards.forEach(({ id }) => {
            moveCardToZoneUndoable(id, zoneId, 'auto', playerId)
          })
        }

        // Keep selection active for additional operations
        return
      } catch (err) {
        console.error('Failed to parse selected cards data:', err)
        // Fall through to single card handling
      }
    }

    // Single card handling - don't do anything if dropping in the same zone
    if (fromZoneId === zoneId) {
      return
    }

    // Move card to this zone
    moveCardToZoneUndoable(cardId, zoneId, 'auto', playerId)
  }

  // Drag-to-select handlers for battlefield
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only enable for battlefield zone and left mouse button
    if (zoneType !== 'battlefield' || e.button !== 0 || !battlefieldRef.current) return

    // Don't start selection if clicking on a card
    const target = e.target as HTMLElement
    if (target.closest('[data-card-id]')) return

    const rect = battlefieldRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsSelecting(true)
    setSelectionStart({ x, y })
    setSelectionEnd({ x, y })

    // Clear selection if not holding Ctrl
    if (!e.ctrlKey && !e.metaKey) {
      clearSelection()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !battlefieldRef.current || !selectionStart) return

    const rect = battlefieldRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setSelectionEnd({ x, y })
  }

  const handleMouseUp = () => {
    if (!isSelecting || !selectionStart || !selectionEnd || !battlefieldRef.current) {
      setIsSelecting(false)
      return
    }

    // Calculate selection rectangle
    const minX = Math.min(selectionStart.x, selectionEnd.x)
    const maxX = Math.max(selectionStart.x, selectionEnd.x)
    const minY = Math.min(selectionStart.y, selectionEnd.y)
    const maxY = Math.max(selectionStart.y, selectionEnd.y)

    // Find cards within selection rectangle
    const selectedCardIds: string[] = []
    const halfCardWidth = cardWidth / 2
    const halfCardHeight = cardHeight / 2

    cards.forEach(({ id, card }) => {
      if (!card.position) return

      // Check if card center is within selection rectangle
      const cardCenterX = card.position.x + halfCardWidth
      const cardCenterY = card.position.y + halfCardHeight

      if (
        cardCenterX >= minX &&
        cardCenterX <= maxX &&
        cardCenterY >= minY &&
        cardCenterY <= maxY
      ) {
        selectedCardIds.push(id)
      }
    })

    // Select the cards
    if (selectedCardIds.length > 0) {
      selectCards(selectedCardIds)
    }

    setIsSelecting(false)
    setSelectionStart(null)
    setSelectionEnd(null)
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
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
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
            padding: '0.5rem 1rem',
            marginBottom: '0.5rem',
            flexShrink: 0,
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
            flex: 1,
            minHeight: 0,
            cursor: isSelecting ? 'crosshair' : 'default',
            overflow: isOpponentBattlefield ? 'hidden' : 'visible',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isSelecting) {
              handleMouseUp()
            }
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              transform: isOpponentBattlefield
                ? autoZoomTransform
                : (opponentPosition === 'top' ? 'scaleX(-1)' : 'none'),
              transformOrigin: '0 0',
              transition: 'transform 0.3s ease',
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
                  playerId={viewerPlayerId || playerId}
                  isInteractive={isInteractive}
                  forceFaceDown={false}
                  opponentPosition={opponentPosition}
                  cardSize={cardSize}
                />
              ))
            )}

            {/* Selection rectangle */}
            {isSelecting && selectionStart && selectionEnd && (
              <div
                style={{
                  position: 'absolute',
                  left: `${Math.min(selectionStart.x, selectionEnd.x)}px`,
                  top: `${Math.min(selectionStart.y, selectionEnd.y)}px`,
                  width: `${Math.abs(selectionEnd.x - selectionStart.x)}px`,
                  height: `${Math.abs(selectionEnd.y - selectionStart.y)}px`,
                  border: '2px dashed #2196F3',
                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                  pointerEvents: 'none',
                  zIndex: 10000,
                }}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  // Calculate overlap based on card count
  const calculateCardSpacing = (cardCount: number): number => {
    if (cardCount <= 5) return 100 // No overlap, full spacing
    if (cardCount <= 10) return 80 // Slight overlap (20% overlap)
    if (cardCount <= 15) return 60 // Medium overlap (40% overlap)
    return 50 // Tight overlap (50% overlap - minimum)
  }

  const cardSpacing = calculateCardSpacing(cards.length)

  // Regular zones (hand, graveyard, exile) with overlapping card layout
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
        overflow: 'visible',
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
          flexWrap: 'nowrap',
          overflowX: 'auto',
          overflowY: 'visible',
          minHeight: '160px',
          alignItems: 'flex-start',
          paddingTop: '1rem',
          paddingBottom: '0.5rem',
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
          cards.map(({ id, card }, index) => {
            const shouldHideCard =
              zoneType === 'hand' &&
              !!viewerPlayerId &&
              playerId !== viewerPlayerId

            return (
              <div
                key={id}
                style={{
                  marginLeft: index === 0 ? '0' : `-${100 - cardSpacing}px`,
                  position: 'relative',
                  zIndex: index,
                  transition: 'all 0.2s ease',
                  isolation: 'auto',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.zIndex = '999'
                  e.currentTarget.style.transform = 'translateY(-10px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.zIndex = String(index)
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <CardComponent
                  key={id}
                  cardId={id}
                  card={card}
                  playerId={viewerPlayerId || playerId}
                  isInteractive={isInteractive}
                  forceFaceDown={shouldHideCard}
                  cardSize={cardSize}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
