import { useCardImage } from './hooks/useCardImage'

interface RevealCardModalProps {
  cardName: string
  revealedBy: string
  onClose: () => void
}

export function RevealCardModal({ cardName, revealedBy, onClose }: RevealCardModalProps) {
  const { imageUrl, loading } = useCardImage(cardName)

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: 0, fontSize: '1.5rem', textAlign: 'center' }}>
          {revealedBy} revealed:
        </h2>

        {/* Card Display */}
        <div
          style={{
            width: '300px',
            height: '420px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '3px solid #333',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <div style={{ fontSize: '1rem', color: '#999' }}>Loading card image...</div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={cardName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                padding: '1rem',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                textAlign: 'center',
                wordBreak: 'break-word',
              }}
            >
              {cardName}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            minWidth: '120px',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
