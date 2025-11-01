import { useState } from 'react'
import { NumberInputModal } from './NumberInputModal'

interface CompactDeckProps {
  cardCount: number
  playerColor: string
  onDrawOne: () => void
  onDrawN: (count: number) => void
  onMillOne: () => void
  onMillN: (count: number) => void
  onExileOne: () => void
  onShuffle: () => void
}

export function CompactDeck({
  cardCount,
  playerColor,
  onDrawOne,
  onDrawN,
  onMillOne,
  onMillN,
  onExileOne,
  onShuffle,
}: CompactDeckProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [numberModal, setNumberModal] = useState<{
    title: string
    onConfirm: (value: number) => void
  } | null>(null)

  const handleDoubleClick = () => {
    if (cardCount > 0) {
      onDrawOne()
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Deck Card */}
      <div
        onDoubleClick={handleDoubleClick}
        style={{
          width: '120px',
          height: '160px',
          backgroundColor: '#333',
          border: '2px solid #666',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: cardCount > 0 ? 'pointer' : 'default',
          position: 'relative',
          userSelect: 'none',
        }}
      >
        <div style={{ fontSize: '3rem', color: '#999' }}>🃏</div>
        <div
          style={{
            fontSize: '0.75rem',
            color: '#999',
            marginTop: '0.5rem',
          }}
        >
          {cardCount} cards
        </div>

        {/* Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid #333',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ⋮
        </button>

        {/* Card Count Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: playerColor,
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}
        >
          📚 {cardCount}
        </div>
      </div>

      {/* Menu Dropdown */}
      {showMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
            }}
            onClick={() => setShowMenu(false)}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: '8px',
              backgroundColor: '#fff',
              border: '2px solid #333',
              borderRadius: '6px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              zIndex: 100,
              minWidth: '150px',
            }}
          >
            <div
              style={{
                padding: '0.5rem 0.75rem',
                cursor: cardCount > 0 ? 'pointer' : 'not-allowed',
                fontSize: '0.75rem',
                borderBottom: '1px solid #eee',
                backgroundColor: cardCount > 0 ? 'white' : '#f5f5f5',
              }}
              onClick={() => {
                if (cardCount > 0) {
                  setNumberModal({
                    title: 'Draw how many cards?',
                    onConfirm: (n) => {
                      onDrawN(n)
                      setNumberModal(null)
                      setShowMenu(false)
                    },
                  })
                }
              }}
              onMouseEnter={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              Draw N Cards
            </div>
            <div
              style={{
                padding: '0.5rem 0.75rem',
                cursor: cardCount > 0 ? 'pointer' : 'not-allowed',
                fontSize: '0.75rem',
                borderBottom: '1px solid #eee',
                backgroundColor: cardCount > 0 ? 'white' : '#f5f5f5',
              }}
              onClick={() => {
                if (cardCount > 0) {
                  onMillOne()
                  setShowMenu(false)
                }
              }}
              onMouseEnter={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              Mill 1 Card
            </div>
            <div
              style={{
                padding: '0.5rem 0.75rem',
                cursor: cardCount > 0 ? 'pointer' : 'not-allowed',
                fontSize: '0.75rem',
                borderBottom: '1px solid #eee',
                backgroundColor: cardCount > 0 ? 'white' : '#f5f5f5',
              }}
              onClick={() => {
                if (cardCount > 0) {
                  setNumberModal({
                    title: 'Mill how many cards?',
                    onConfirm: (n) => {
                      onMillN(n)
                      setNumberModal(null)
                      setShowMenu(false)
                    },
                  })
                }
              }}
              onMouseEnter={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              Mill N Cards
            </div>
            <div
              style={{
                padding: '0.5rem 0.75rem',
                cursor: cardCount > 0 ? 'pointer' : 'not-allowed',
                fontSize: '0.75rem',
                borderBottom: '1px solid #eee',
                backgroundColor: cardCount > 0 ? 'white' : '#f5f5f5',
              }}
              onClick={() => {
                if (cardCount > 0) {
                  onExileOne()
                  setShowMenu(false)
                }
              }}
              onMouseEnter={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              Exile Top Card
            </div>
            <div
              style={{
                padding: '0.5rem 0.75rem',
                cursor: cardCount > 0 ? 'pointer' : 'not-allowed',
                fontSize: '0.75rem',
                backgroundColor: cardCount > 0 ? 'white' : '#f5f5f5',
              }}
              onClick={() => {
                if (cardCount > 0) {
                  onShuffle()
                  setShowMenu(false)
                }
              }}
              onMouseEnter={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              Shuffle Deck
            </div>
          </div>
        </>
      )}

      {/* Number Input Modal */}
      {numberModal && (
        <NumberInputModal
          title={numberModal.title}
          max={cardCount}
          onConfirm={numberModal.onConfirm}
          onCancel={() => setNumberModal(null)}
        />
      )}
    </div>
  )
}
