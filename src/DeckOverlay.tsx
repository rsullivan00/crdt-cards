import { Card as CardType } from './store'

interface DeckOverlayProps {
  isOpen: boolean
  onClose: () => void
  cards: Array<{ id: string; card: CardType }>
  playerColor: string
  playerId: string
  viewerPlayerId: string
  revealedCard: { cardName: string; revealedBy: string } | null
}

export function DeckOverlay({
  isOpen,
  onClose,
  cards,
  playerColor: _playerColor,
  playerId,
  viewerPlayerId,
  revealedCard,
}: DeckOverlayProps) {
  const isOwnDeck = playerId === viewerPlayerId
  const isRevealedByThisPlayer = revealedCard?.revealedBy === playerId

  return (
    <div
      style={{
        height: isOpen ? '300px' : '0',
        overflow: 'hidden',
        transition: 'height 0.3s ease',
        flexShrink: 0,
        backgroundColor: '#fff',
        borderTop: isOpen ? '2px solid #607D8B' : 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.5rem 1rem',
          borderBottom: '2px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>
          📚 Deck ({cards.length} {cards.length === 1 ? 'card' : 'cards'})
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
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

      {/* Deck Content */}
      <div
        style={{
          height: 'calc(300px - 48px)',
          overflow: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {cards.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
            Deck is empty
          </div>
        ) : isOwnDeck ? (
          /* Own deck - show all cards face up */
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {cards.map(({ id, card }, index) => (
              <div
                key={id}
                style={{
                  width: '100px',
                  height: '140px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  padding: '0.5rem',
                  textAlign: 'center',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>#{index + 1}</div>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>
                  {card.metadata?.name || card.oracleId.slice(0, 8)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Opponent's deck - show face down except revealed top card */
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {cards.map(({ id, card }, index) => {
              const isTopCard = index === 0
              const showFaceUp = isTopCard && isRevealedByThisPlayer

              return (
                <div
                  key={id}
                  style={{
                    width: '100px',
                    height: '140px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: showFaceUp ? '#fff3e0' : '#37474f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    padding: '0.5rem',
                    textAlign: 'center',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    color: showFaceUp ? '#000' : '#fff',
                  }}
                >
                  {showFaceUp ? (
                    <>
                      <div style={{ fontWeight: 'bold', color: '#ff9800' }}>
                        👁️ Revealed
                      </div>
                      <div style={{ fontSize: '0.7rem' }}>
                        {revealedCard?.cardName || card.metadata?.name || card.oracleId.slice(0, 8)}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '2rem' }}>🂠</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                        #{index + 1}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
