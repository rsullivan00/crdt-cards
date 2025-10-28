import { reorderCard } from './store'

interface DropTargetProps {
  slotIndex: number
  zoneId: string
  playerId: string
  insertBeforeCardId: string | null
  onDrop?: () => void
}

export function DropTarget({
  slotIndex,
  zoneId,
  playerId,
  insertBeforeCardId,
  onDrop,
}: DropTargetProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const draggedCardId = e.dataTransfer.getData('cardId')
    const dragPlayerId = e.dataTransfer.getData('playerId')
    const fromZoneId = e.dataTransfer.getData('fromZoneId')

    // Only allow dropping your own cards
    if (dragPlayerId !== playerId) {
      return
    }

    // If dropping in same zone, use reorder
    if (fromZoneId === zoneId) {
      reorderCard(draggedCardId, zoneId, insertBeforeCardId, playerId)
    } else {
      // Moving to different zone - need to implement moveCardToZone with specific position
      // For now, just use reorderCard which will move it
      reorderCard(draggedCardId, zoneId, insertBeforeCardId, playerId)
    }

    onDrop?.()
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        width: '120px',
        height: '160px',
        border: '3px dashed rgba(33, 150, 243, 0.5)',
        borderRadius: '8px',
        backgroundColor: 'rgba(33, 150, 243, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        color: 'rgba(33, 150, 243, 0.3)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(33, 150, 243, 0.15)'
        e.currentTarget.style.borderColor = 'rgba(33, 150, 243, 0.8)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(33, 150, 243, 0.05)'
        e.currentTarget.style.borderColor = 'rgba(33, 150, 243, 0.5)'
      }}
    >
      ⬇
    </div>
  )
}
