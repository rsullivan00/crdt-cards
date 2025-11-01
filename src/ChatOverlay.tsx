import { ChatLog } from './ChatLog'

interface ChatOverlayProps {
  isOpen: boolean
  onClose: () => void
  currentPlayerId: string
}

export function ChatOverlay({ isOpen, onClose, currentPlayerId }: ChatOverlayProps) {
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

      {/* Chat Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          maxWidth: '90vw',
          backgroundColor: '#fff',
          boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s ease',
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
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>💬 Chat & Log</h3>
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

        {/* Chat Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ChatLog currentPlayerId={currentPlayerId} />
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}
