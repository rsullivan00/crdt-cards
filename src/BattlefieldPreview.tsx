import { useState, useEffect, useRef, memo } from 'react'
import { Card as CardType } from './store'
import { Card } from './Card'

interface BattlefieldPreviewProps {
  cards: Array<{ id: string; card: CardType }>
  playerId: string
  containerWidth?: number
  containerHeight?: number
}

export const BattlefieldPreview = memo(function BattlefieldPreview({
  cards,
  playerId,
  containerWidth = 300,
  containerHeight = 180,
}: BattlefieldPreviewProps) {
  const [autoZoomTransform, setAutoZoomTransform] = useState('none')
  const previewRef = useRef<HTMLDivElement>(null)

  // Calculate auto-zoom transform
  useEffect(() => {
    if (cards.length === 0) {
      setAutoZoomTransform('none')
      return
    }

    // Calculate bounding box of all cards
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    const cardWidth = 120
    const cardHeight = 160

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

    // Calculate center of content
    const contentCenterX = (minX + maxX) / 2
    const contentCenterY = (minY + maxY) / 2

    // Calculate scale to fit (min 0.1, max 0.5 for preview)
    const scaleX = containerWidth / contentWidth
    const scaleY = containerHeight / contentHeight
    const scale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 0.5)

    // Calculate translation to center the content
    const containerCenterX = containerWidth / 2
    const containerCenterY = containerHeight / 2
    
    const translateX = containerCenterX - contentCenterX * scale
    const translateY = containerCenterY - contentCenterY * scale

    setAutoZoomTransform(`translate(${translateX}px, ${translateY}px) scale(${scale})`)
  }, [cards, containerWidth, containerHeight])

  return (
    <div
      ref={previewRef}
      style={{
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: autoZoomTransform,
          transformOrigin: '0 0',
          transition: 'transform 0.3s ease',
        }}
      >
        {cards.length === 0 ? (
          <div
            style={{
              color: '#999',
              fontStyle: 'italic',
              fontSize: '0.75rem',
              padding: '1rem',
              textAlign: 'center',
            }}
          >
            No cards
          </div>
        ) : (
          cards.map(({ id, card }) => (
            <Card
              key={id}
              cardId={id}
              card={card}
              playerId={playerId}
              isInteractive={false}
              forceFaceDown={false}
            />
          ))
        )}
      </div>
    </div>
  )
})
