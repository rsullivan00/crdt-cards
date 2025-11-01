import { Zone } from './Zone'
import { Card as CardType } from './store'

interface ExileOverlayProps {
  isOpen: boolean
  onClose: () => void
  cards: Array<{ id: string; card: CardType }>
  playerColor: string
  playerId: string
  isInteractive: boolean
  viewerPlayerId: string
}

export function ExileOverlay({
  isOpen,
  onClose,
  cards,
  playerColor,
  playerId,
  isInteractive,
  viewerPlayerId,
}: ExileOverlayProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Overlay Panel */}
      <div
        style={{
          position: 'fixed',
          left: '50%',
          bottom: '220px',
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: '1200px',
          maxHeight: '400px',
          backgroundColor: '#fff',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          animation: 'slideInUp 0.3s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem',
            borderBottom: '2px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>🚫 Exile</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
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
            flex: 1,
            overflow: 'auto',
            padding: '1rem',
          }}
        >
          <Zone
            zoneId={`exile-${playerId}`}
            zoneName="Exile"
            zoneType="exile"
            cards={cards}
            playerColor={playerColor}
            playerId={playerId}
            isInteractive={isInteractive}
            viewerPlayerId={viewerPlayerId}
          />
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from {
            transform: translateX(-50%) translateY(100%);
          }
          to {
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </>
  )
}
