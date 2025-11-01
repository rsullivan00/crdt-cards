import { Zone } from './Zone'
import { Card as CardType } from './store'

interface ZoneDrawerProps {
  isOpen: boolean
  onClose: () => void
  graveyardCards: Array<{ id: string; card: CardType }>
  exileCards: Array<{ id: string; card: CardType }>
  playerColor: string
  playerId: string
  isInteractive: boolean
  viewerPlayerId: string
}

export function ZoneDrawer({
  isOpen,
  onClose,
  graveyardCards,
  exileCards,
  playerColor,
  playerId,
  isInteractive,
  viewerPlayerId,
}: ZoneDrawerProps) {
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

      {/* Drawer Panel */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: '40vh',
          maxHeight: '400px',
          backgroundColor: '#fff',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
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
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>📜 Graveyard & Exile</h3>
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

        {/* Zones Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            padding: '1rem',
          }}
        >
          <Zone
            zoneId={`graveyard-${playerId}`}
            zoneName="Graveyard"
            zoneType="graveyard"
            cards={graveyardCards}
            playerColor={playerColor}
            playerId={playerId}
            isInteractive={isInteractive}
            viewerPlayerId={viewerPlayerId}
          />
          <Zone
            zoneId={`exile-${playerId}`}
            zoneName="Exile"
            zoneType="exile"
            cards={exileCards}
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
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
