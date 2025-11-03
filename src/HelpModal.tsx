import { createPortal } from 'react-dom'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>How to Use</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#666',
                padding: '0',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
            {/* Multi-Select Section */}
            <section style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#2196F3' }}>
                🎯 Multi-Select Cards
              </h3>
              <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
                <li>
                  <strong>Ctrl+Click</strong> to select/deselect individual cards
                </li>
                <li>
                  <strong>Drag-to-select</strong> on battlefield: Click and drag to create a selection
                  rectangle
                </li>
                <li>Selected cards show a <span style={{ color: '#2196F3' }}>blue outline</span></li>
                <li>Works in all zones: battlefield, hand, graveyard, and exile</li>
              </ul>
            </section>

            {/* Batch Operations Section */}
            <section style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#4CAF50' }}>
                ⚡ Batch Operations
              </h3>
              <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
                <li>
                  Click the <strong>⋮ menu</strong> on any selected card
                </li>
                <li>
                  <strong>Move to...</strong> moves all selected cards together
                </li>
                <li>
                  <strong>Counters</strong> adds/removes counters on all selected cards
                </li>
                <li>Menu shows <strong>(X cards)</strong> when multiple are selected</li>
                <li>Selection persists after operations for multi-step workflows</li>
              </ul>
            </section>

            {/* Group Dragging Section */}
            <section style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#9C27B0' }}>
                🎮 Group Dragging
              </h3>
              <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
                <li>
                  <strong>Drag selected cards</strong> from hand/graveyard/exile to battlefield
                </li>
                <li>Cards arrange in a grid (5 per row) where you drop them</li>
                <li>
                  <strong>Drag within battlefield</strong> maintains relative positions
                </li>
                <li>All selected cards move together</li>
              </ul>
            </section>

            {/* Card Actions Section */}
            <section style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#FF9800' }}>
                🃏 Card Actions
              </h3>
              <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
                <li>
                  <strong>Click</strong> battlefield cards to tap/untap
                </li>
                <li>
                  <strong>⋮ Menu</strong> for moving, adding counters, deleting tokens
                </li>
                <li>
                  <strong>Drag</strong> cards to reposition on battlefield
                </li>
                <li>
                  <strong>Right-click</strong> opens the card menu
                </li>
              </ul>
            </section>

            {/* Tips Section */}
            <section style={{ marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#666' }}>
                💡 Tips
              </h3>
              <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
                <li>Click empty space to clear selection</li>
                <li>Hold Ctrl while drag-selecting to add to existing selection</li>
                <li>Use batch counters to quickly set up token armies</li>
                <li>Multi-select works great for moving creatures to attack</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
