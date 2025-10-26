import { useState } from 'react'

interface NumberInputModalProps {
  title: string
  max: number
  onConfirm: (value: number) => void
  onCancel: () => void
}

export function NumberInputModal({
  title,
  max,
  onConfirm,
  onCancel,
}: NumberInputModalProps) {
  const [value, setValue] = useState('1')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(value, 10)
    if (num > 0 && num <= max) {
      onConfirm(num)
    }
  }

  const numValue = parseInt(value, 10)
  const isValid = !isNaN(numValue) && numValue > 0 && numValue <= max

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
          maxWidth: '300px',
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>{title}</h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min={1}
              max={max}
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1.25rem',
                border: '2px solid #ddd',
                borderRadius: '6px',
                boxSizing: 'border-box',
                textAlign: 'center',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2196F3'
                e.target.select()
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ddd'
              }}
            />
            <p
              style={{
                margin: '0.5rem 0 0 0',
                fontSize: '0.75rem',
                color: '#666',
                textAlign: 'center',
              }}
            >
              Max: {max}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
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
              type="submit"
              disabled={!isValid}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: isValid ? '#4CAF50' : '#ccc',
                border: 'none',
                borderRadius: '6px',
                cursor: isValid ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => {
                if (isValid) {
                  e.currentTarget.style.backgroundColor = '#45a049'
                }
              }}
              onMouseLeave={(e) => {
                if (isValid) {
                  e.currentTarget.style.backgroundColor = '#4CAF50'
                }
              }}
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
