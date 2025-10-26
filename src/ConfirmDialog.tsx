interface ConfirmDialogProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  confirmColor?: string
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  confirmColor = '#F44336',
}: ConfirmDialogProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          maxWidth: '400px',
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          style={{
            margin: '0 0 1.5rem 0',
            fontSize: '1rem',
            textAlign: 'center',
            lineHeight: '1.5',
          }}
        >
          {message}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              color: '#666',
              backgroundColor: '#f5f5f5',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: confirmColor,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
