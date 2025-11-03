import { useState } from 'react'
import { createPortal } from 'react-dom'
import { NumberInputModal } from './NumberInputModal'
import { ScryPeekModal } from './ScryPeekModal'
import { Card, getTopCards, getAllDeckCards, reorderTopCards } from './store'
import { useCardImage } from './hooks/useCardImage'

interface CompactDeckProps {
  cardCount: number
  playerColor: string
  playerId: string
  revealedCard?: { cardName: string; revealedBy: string } | null
  onDrawOne: () => void
  onDrawN: (count: number) => void
  onMillOne: () => void
  onMillN: (count: number) => void
  onExileOne: (faceDown: boolean) => void
  onExileN: (count: number, faceDown: boolean) => void
  onRevealTop: () => void
  onShuffle: () => void
}

export function CompactDeck({
  cardCount,
  playerColor,
  playerId,
  revealedCard,
  onDrawOne,
  onDrawN,
  onMillOne,
  onMillN,
  onExileOne,
  onExileN,
  onRevealTop,
  onShuffle,
}: CompactDeckProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showDrawSubmenu, setShowDrawSubmenu] = useState(false)
  const [showMillSubmenu, setShowMillSubmenu] = useState(false)
  const [showExileSubmenu, setShowExileSubmenu] = useState(false)
  const [showScrySubmenu, setShowScrySubmenu] = useState(false)
  const [showPeekSubmenu, setShowPeekSubmenu] = useState(false)
  const [drawSubmenuPosition, setDrawSubmenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [millSubmenuPosition, setMillSubmenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [exileSubmenuPosition, setExileSubmenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [scrySubmenuPosition, setScrySubmenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [peekSubmenuPosition, setPeekSubmenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [numberModal, setNumberModal] = useState<{
    title: string
    onConfirm: (value: number) => void
  } | null>(null)
  const [scryPeekModal, setScryPeekModal] = useState<{
    cards: Array<{ cardId: string; card: Card }>
    mode: 'scry' | 'peek'
  } | null>(null)
  const [showRevealPreview, setShowRevealPreview] = useState(false)
  const [revealPreviewPosition, setRevealPreviewPosition] = useState<{ top: number; left: number } | null>(null)

  const { imageUrl: revealedImageUrl } = useCardImage(revealedCard?.cardName || '')

  const handleDoubleClick = () => {
    if (cardCount > 0) {
      onDrawOne()
    }
  }

  const menuStyle: React.CSSProperties = menuPosition
    ? {
        position: 'fixed',
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
        backgroundColor: 'white',
        border: '2px solid #333',
        borderRadius: '6px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        zIndex: 9999,
        minWidth: '150px',
      }
    : {
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
      }

  const menuItemStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    cursor: cardCount > 0 ? 'pointer' : 'not-allowed',
    fontSize: '0.75rem',
    borderBottom: '1px solid #eee',
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Deck Card */}
      <div
        onDoubleClick={handleDoubleClick}
        style={{
          width: '120px',
          height: '160px',
          backgroundColor: revealedCard && revealedImageUrl ? 'transparent' : '#333',
          backgroundImage: revealedCard && revealedImageUrl ? `url(${revealedImageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
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
        onMouseEnter={(e) => {
          // Only show hover preview if there's a revealed card
          if (!revealedCard) return

          const rect = e.currentTarget.getBoundingClientRect()
          const viewportWidth = window.innerWidth

          // Calculate position for preview - show to the left of the deck
          let left = rect.left - 320 // 300px card width + 20px gap
          let top = rect.top

          // If would go off left edge, show to the right instead
          if (left < 8) {
            left = rect.right + 20
          }

          // If would go off right edge, center it
          if (left + 300 > viewportWidth) {
            left = Math.max(8, (viewportWidth - 300) / 2)
          }

          // Keep within vertical bounds
          if (top + 420 > window.innerHeight) {
            top = Math.max(8, window.innerHeight - 420 - 8)
          }

          setRevealPreviewPosition({ top, left })
          setShowRevealPreview(true)
        }}
        onMouseLeave={() => {
          setShowRevealPreview(false)
          setRevealPreviewPosition(null)
        }}
      >
        {/* Show card count only when no card is revealed */}
        {!revealedCard && (
          <div
            style={{
              fontSize: '0.75rem',
              color: '#999',
              marginTop: '0.5rem',
            }}
          >
            {cardCount} cards
          </div>
        )}

        {/* Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (!showMenu) {
              const rect = e.currentTarget.getBoundingClientRect()
              const viewportWidth = window.innerWidth

              // Calculate position - place above the button
              let left = rect.left
              let top = rect.top - 8

              // If menu would go off left edge, adjust
              const menuWidth = 180
              if (left + menuWidth > viewportWidth) {
                left = viewportWidth - menuWidth - 8
              }

              // If menu would go off top, place below instead
              const menuHeight = 250
              if (top - menuHeight < 8) {
                top = rect.bottom + 8
              } else {
                top = top - menuHeight
              }

              setMenuPosition({ top, left })
            }
            setShowMenu(!showMenu)
          }}
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
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

      {/* Revealed Card Preview - rendered via portal */}
      {showRevealPreview && revealPreviewPosition && revealedCard && createPortal(
        <div
          style={{
            position: 'fixed',
            top: `${revealPreviewPosition.top}px`,
            left: `${revealPreviewPosition.left}px`,
            width: '300px',
            height: '420px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '3px solid #333',
            backgroundColor: '#f5f5f5',
            boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
            zIndex: 10001,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {revealedImageUrl ? (
            <img
              src={revealedImageUrl}
              alt={revealedCard.cardName}
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
              {revealedCard.cardName}
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Menu - rendered via portal */}
      {showMenu && createPortal(
        <>
          {/* Backdrop to close menu */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998,
            }}
            onClick={() => {
              setShowMenu(false)
              setShowDrawSubmenu(false)
              setShowMillSubmenu(false)
              setShowExileSubmenu(false)
              setShowScrySubmenu(false)
              setShowPeekSubmenu(false)
            }}
          />
          <div style={menuStyle}>
            {/* Draw Submenu Header */}
            <div
              style={{
                ...menuItemStyle,
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: cardCount > 0 ? 'white' : '#f5f5f5',
              }}
              onMouseEnter={(e) => {
                if (cardCount === 0) return
                e.currentTarget.style.backgroundColor = '#f5f5f5'

                // Close other submenus
                setShowMillSubmenu(false)
                setShowExileSubmenu(false)
                setShowScrySubmenu(false)
                setShowPeekSubmenu(false)

                const rect = e.currentTarget.getBoundingClientRect()
                const viewportWidth = window.innerWidth
                const viewportHeight = window.innerHeight

                let left = rect.right + 4
                let top = rect.top

                const submenuWidth = 180
                const submenuHeight = 100

                if (left + submenuWidth > viewportWidth) {
                  left = rect.left - submenuWidth - 4
                }

                if (top + submenuHeight > viewportHeight) {
                  top = Math.max(8, viewportHeight - submenuHeight - 8)
                }

                setDrawSubmenuPosition({ top, left })
                setShowDrawSubmenu(true)
              }}
              onMouseLeave={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <span>Draw ▶</span>
            </div>

            {/* Mill Submenu Header */}
            <div
              style={{
                ...menuItemStyle,
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: cardCount > 0 ? 'white' : '#f5f5f5',
              }}
              onMouseEnter={(e) => {
                if (cardCount === 0) return
                e.currentTarget.style.backgroundColor = '#f5f5f5'

                setShowDrawSubmenu(false)
                setShowExileSubmenu(false)
                setShowScrySubmenu(false)
                setShowPeekSubmenu(false)

                const rect = e.currentTarget.getBoundingClientRect()
                const viewportWidth = window.innerWidth
                const viewportHeight = window.innerHeight

                let left = rect.right + 4
                let top = rect.top

                const submenuWidth = 180
                const submenuHeight = 100

                if (left + submenuWidth > viewportWidth) {
                  left = rect.left - submenuWidth - 4
                }

                if (top + submenuHeight > viewportHeight) {
                  top = Math.max(8, viewportHeight - submenuHeight - 8)
                }

                setMillSubmenuPosition({ top, left })
                setShowMillSubmenu(true)
              }}
              onMouseLeave={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <span>Mill ▶</span>
            </div>

            {/* Exile Submenu Header */}
            <div
              style={{
                ...menuItemStyle,
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: cardCount > 0 ? 'white' : '#f5f5f5',
              }}
              onMouseEnter={(e) => {
                if (cardCount === 0) return
                e.currentTarget.style.backgroundColor = '#f5f5f5'

                setShowDrawSubmenu(false)
                setShowMillSubmenu(false)
                setShowScrySubmenu(false)
                setShowPeekSubmenu(false)

                const rect = e.currentTarget.getBoundingClientRect()
                const viewportWidth = window.innerWidth
                const viewportHeight = window.innerHeight

                let left = rect.right + 4
                let top = rect.top

                const submenuWidth = 200
                const submenuHeight = 180

                if (left + submenuWidth > viewportWidth) {
                  left = rect.left - submenuWidth - 4
                }

                if (top + submenuHeight > viewportHeight) {
                  top = Math.max(8, viewportHeight - submenuHeight - 8)
                }

                setExileSubmenuPosition({ top, left })
                setShowExileSubmenu(true)
              }}
              onMouseLeave={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <span>Exile ▶</span>
            </div>

            {/* Scry Submenu Header */}
            <div
              style={{
                ...menuItemStyle,
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: cardCount > 0 ? 'white' : '#f5f5f5',
              }}
              onMouseEnter={(e) => {
                if (cardCount === 0) return
                e.currentTarget.style.backgroundColor = '#f5f5f5'

                setShowDrawSubmenu(false)
                setShowMillSubmenu(false)
                setShowExileSubmenu(false)
                setShowPeekSubmenu(false)

                const rect = e.currentTarget.getBoundingClientRect()
                const viewportWidth = window.innerWidth
                const viewportHeight = window.innerHeight

                let left = rect.right + 4
                let top = rect.top

                const submenuWidth = 180
                const submenuHeight = 100

                if (left + submenuWidth > viewportWidth) {
                  left = rect.left - submenuWidth - 4
                }

                if (top + submenuHeight > viewportHeight) {
                  top = Math.max(8, viewportHeight - submenuHeight - 8)
                }

                setScrySubmenuPosition({ top, left })
                setShowScrySubmenu(true)
              }}
              onMouseLeave={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <span>Scry ▶</span>
            </div>

            {/* Peek Submenu Header */}
            <div
              style={{
                ...menuItemStyle,
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: cardCount > 0 ? 'white' : '#f5f5f5',
              }}
              onMouseEnter={(e) => {
                if (cardCount === 0) return
                e.currentTarget.style.backgroundColor = '#f5f5f5'

                setShowDrawSubmenu(false)
                setShowMillSubmenu(false)
                setShowExileSubmenu(false)
                setShowScrySubmenu(false)

                const rect = e.currentTarget.getBoundingClientRect()
                const viewportWidth = window.innerWidth
                const viewportHeight = window.innerHeight

                let left = rect.right + 4
                let top = rect.top

                const submenuWidth = 180
                const submenuHeight = 100

                if (left + submenuWidth > viewportWidth) {
                  left = rect.left - submenuWidth - 4
                }

                if (top + submenuHeight > viewportHeight) {
                  top = Math.max(8, viewportHeight - submenuHeight - 8)
                }

                setPeekSubmenuPosition({ top, left })
                setShowPeekSubmenu(true)
              }}
              onMouseLeave={(e) => {
                if (cardCount > 0) e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <span>View ▶</span>
            </div>

            {/* Reveal Top Card */}
            <div
              style={{
                ...menuItemStyle,
                backgroundColor: cardCount > 0 ? 'white' : '#f5f5f5',
              }}
              onClick={() => {
                if (cardCount > 0) {
                  onRevealTop()
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
              Reveal Top Card
            </div>

            {/* Shuffle Deck */}
            <div
              style={{
                ...menuItemStyle,
                borderBottom: 'none',
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

          {/* Draw Submenu */}
          {showDrawSubmenu && drawSubmenuPosition && (
            <div
              style={{
                position: 'fixed',
                top: `${drawSubmenuPosition.top}px`,
                left: `${drawSubmenuPosition.left}px`,
                backgroundColor: 'white',
                border: '2px solid #333',
                borderRadius: '6px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                zIndex: 10000,
                minWidth: '150px',
              }}
              onMouseEnter={() => setShowDrawSubmenu(true)}
              onMouseLeave={() => {
                setShowDrawSubmenu(false)
                setDrawSubmenuPosition(null)
              }}
            >
              <div
                style={menuItemStyle}
                onClick={() => {
                  onDrawOne()
                  setShowMenu(false)
                  setShowDrawSubmenu(false)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Draw 1
              </div>
              <div
                style={{ ...menuItemStyle, borderBottom: 'none' }}
                onClick={() => {
                  setNumberModal({
                    title: 'Draw how many cards?',
                    onConfirm: (n) => {
                      onDrawN(n)
                      setNumberModal(null)
                      setShowMenu(false)
                      setShowDrawSubmenu(false)
                    },
                  })
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Draw N
              </div>
            </div>
          )}

          {/* Mill Submenu */}
          {showMillSubmenu && millSubmenuPosition && (
            <div
              style={{
                position: 'fixed',
                top: `${millSubmenuPosition.top}px`,
                left: `${millSubmenuPosition.left}px`,
                backgroundColor: 'white',
                border: '2px solid #333',
                borderRadius: '6px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                zIndex: 10000,
                minWidth: '150px',
              }}
              onMouseEnter={() => setShowMillSubmenu(true)}
              onMouseLeave={() => {
                setShowMillSubmenu(false)
                setMillSubmenuPosition(null)
              }}
            >
              <div
                style={menuItemStyle}
                onClick={() => {
                  onMillOne()
                  setShowMenu(false)
                  setShowMillSubmenu(false)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Mill 1
              </div>
              <div
                style={{ ...menuItemStyle, borderBottom: 'none' }}
                onClick={() => {
                  setNumberModal({
                    title: 'Mill how many cards?',
                    onConfirm: (n) => {
                      onMillN(n)
                      setNumberModal(null)
                      setShowMenu(false)
                      setShowMillSubmenu(false)
                    },
                  })
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Mill N
              </div>
            </div>
          )}

          {/* Exile Submenu */}
          {showExileSubmenu && exileSubmenuPosition && (
            <div
              style={{
                position: 'fixed',
                top: `${exileSubmenuPosition.top}px`,
                left: `${exileSubmenuPosition.left}px`,
                backgroundColor: 'white',
                border: '2px solid #333',
                borderRadius: '6px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                zIndex: 10000,
                minWidth: '180px',
              }}
              onMouseEnter={() => setShowExileSubmenu(true)}
              onMouseLeave={() => {
                setShowExileSubmenu(false)
                setExileSubmenuPosition(null)
              }}
            >
              <div
                style={menuItemStyle}
                onClick={() => {
                  onExileOne(false)
                  setShowMenu(false)
                  setShowExileSubmenu(false)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Exile 1 (face-up)
              </div>
              <div
                style={menuItemStyle}
                onClick={() => {
                  setNumberModal({
                    title: 'Exile how many cards (face-up)?',
                    onConfirm: (n) => {
                      onExileN(n, false)
                      setNumberModal(null)
                      setShowMenu(false)
                      setShowExileSubmenu(false)
                    },
                  })
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Exile N (face-up)
              </div>
              <div
                style={menuItemStyle}
                onClick={() => {
                  onExileOne(true)
                  setShowMenu(false)
                  setShowExileSubmenu(false)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Exile 1 (face-down)
              </div>
              <div
                style={{ ...menuItemStyle, borderBottom: 'none' }}
                onClick={() => {
                  setNumberModal({
                    title: 'Exile how many cards (face-down)?',
                    onConfirm: (n) => {
                      onExileN(n, true)
                      setNumberModal(null)
                      setShowMenu(false)
                      setShowExileSubmenu(false)
                    },
                  })
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Exile N (face-down)
              </div>
            </div>
          )}

          {/* Scry Submenu */}
          {showScrySubmenu && scrySubmenuPosition && (
            <div
              style={{
                position: 'fixed',
                top: `${scrySubmenuPosition.top}px`,
                left: `${scrySubmenuPosition.left}px`,
                backgroundColor: 'white',
                border: '2px solid #333',
                borderRadius: '6px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                zIndex: 10000,
                minWidth: '150px',
              }}
              onMouseEnter={() => setShowScrySubmenu(true)}
              onMouseLeave={() => {
                setShowScrySubmenu(false)
                setScrySubmenuPosition(null)
              }}
            >
              <div
                style={menuItemStyle}
                onClick={() => {
                  const cards = getTopCards(playerId, 1)
                  if (cards.length > 0) {
                    setScryPeekModal({ cards, mode: 'scry' })
                    setShowMenu(false)
                    setShowScrySubmenu(false)
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Scry 1
              </div>
              <div
                style={{ ...menuItemStyle, borderBottom: 'none' }}
                onClick={() => {
                  setNumberModal({
                    title: 'Scry how many cards?',
                    onConfirm: (n) => {
                      const cards = getTopCards(playerId, n)
                      if (cards.length > 0) {
                        setScryPeekModal({ cards, mode: 'scry' })
                      }
                      setNumberModal(null)
                      setShowMenu(false)
                      setShowScrySubmenu(false)
                    },
                  })
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Scry N
              </div>
            </div>
          )}

          {/* Peek Submenu */}
          {showPeekSubmenu && peekSubmenuPosition && (
            <div
              style={{
                position: 'fixed',
                top: `${peekSubmenuPosition.top}px`,
                left: `${peekSubmenuPosition.left}px`,
                backgroundColor: 'white',
                border: '2px solid #333',
                borderRadius: '6px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                zIndex: 10000,
                minWidth: '180px',
              }}
              onMouseEnter={() => setShowPeekSubmenu(true)}
              onMouseLeave={() => {
                setShowPeekSubmenu(false)
                setPeekSubmenuPosition(null)
              }}
            >
              <div
                style={menuItemStyle}
                onClick={() => {
                  const cards = getTopCards(playerId, 1)
                  if (cards.length > 0) {
                    setScryPeekModal({ cards, mode: 'peek' })
                    setShowMenu(false)
                    setShowPeekSubmenu(false)
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → View 1
              </div>
              <div
                style={menuItemStyle}
                onClick={() => {
                  setNumberModal({
                    title: 'View how many cards?',
                    onConfirm: (n) => {
                      const cards = getTopCards(playerId, n)
                      if (cards.length > 0) {
                        setScryPeekModal({ cards, mode: 'peek' })
                      }
                      setNumberModal(null)
                      setShowMenu(false)
                      setShowPeekSubmenu(false)
                    },
                  })
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → View N
              </div>
              <div
                style={{ ...menuItemStyle, borderBottom: 'none' }}
                onClick={() => {
                  const cards = getAllDeckCards(playerId)
                  if (cards.length > 0) {
                    setScryPeekModal({ cards, mode: 'peek' })
                    setShowMenu(false)
                    setShowPeekSubmenu(false)
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → View Whole Deck
              </div>
            </div>
          )}
        </>,
        document.body
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

      {/* Scry/Peek Modal */}
      {scryPeekModal && (
        <ScryPeekModal
          cards={scryPeekModal.cards}
          mode={scryPeekModal.mode}
          playerId={playerId}
          onConfirm={
            scryPeekModal.mode === 'scry'
              ? (topCardIds, bottomCardIds) => {
                  reorderTopCards(playerId, topCardIds, bottomCardIds)
                  setScryPeekModal(null)
                }
              : undefined
          }
          onCancel={() => setScryPeekModal(null)}
        />
      )}
    </div>
  )
}
