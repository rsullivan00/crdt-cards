import { ChatLog } from './ChatLog'

interface ChatOverlayProps {
  isOpen: boolean
  onClose: () => void
  currentPlayerId: string
}

export function ChatOverlay({ isOpen, onClose, currentPlayerId }: ChatOverlayProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '400px',
        maxWidth: '50vw',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.3s ease',
        zIndex: 100,
      }}
    >
      {/* Floating Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(0, 0, 0, 0.2)',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          fontSize: '1.25rem',
          cursor: 'pointer',
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          zIndex: 101,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)'
          e.currentTarget.style.color = '#333'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
          e.currentTarget.style.color = '#666'
        }}
      >
        ×
      </button>

      {/* Chat Content */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <ChatLog currentPlayerId={currentPlayerId} />
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
