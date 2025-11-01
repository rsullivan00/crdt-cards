import { Zone } from './Zone'
import { Card as CardType } from './store'

interface GraveyardOverlayProps {
  isOpen: boolean
  onClose: () => void
  cards: Array<{ id: string; card: CardType }>
  playerColor: string
  playerId: string
  isInteractive: boolean
  viewerPlayerId: string
}

export function GraveyardOverlay({
  isOpen,
  onClose,
  cards,
  playerColor,
  playerId,
  isInteractive,
  viewerPlayerId,
}: GraveyardOverlayProps) {
  return (
    <div
      style={{
        height: isOpen ? '200px' : '0',
        overflow: 'hidden',
        transition: 'height 0.3s ease',
        flexShrink: 0,
        backgroundColor: '#fff',
        borderTop: isOpen ? '2px solid #757575' : 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.5rem 1rem',
          borderBottom: '2px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>💀 Graveyard</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            color: '#666',
            padding: '0.25rem',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#333'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#666'
          }}
        >
          ×
        </button>
      </div>

      {/* Zone Content */}
      <div
        style={{
          height: 'calc(200px - 48px)',
          overflow: 'auto',
          padding: '0.5rem',
        }}
      >
        <Zone
          zoneId={`graveyard-${playerId}`}
          zoneName="Graveyard"
          zoneType="graveyard"
          cards={cards}
          playerColor={playerColor}
          playerId={playerId}
          isInteractive={isInteractive}
          viewerPlayerId={viewerPlayerId}
        />
      </div>
    </div>
  )
}
