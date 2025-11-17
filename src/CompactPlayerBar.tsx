import { Player, getPlayerColor, Card as CardType } from './store'
import { BattlefieldPreview } from './BattlefieldPreview'

interface CompactPlayerBarProps {
  players: Array<{ id: string; player: Player }>
  currentPlayerId: string
  viewingPlayerId: string
  currentTurnPlayerId: string | null
  onSelectPlayer: (playerId: string) => void
  getZoneCards: (zoneId: string) => Array<{ id: string; card: CardType }>
}

export function CompactPlayerBar({
  players,
  currentPlayerId,
  viewingPlayerId,
  currentTurnPlayerId,
  onSelectPlayer,
  getZoneCards,
}: CompactPlayerBarProps) {
  if (players.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'transparent',
          padding: '0.75rem 1rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#666',
        }}
      >
        Waiting for players to join...
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: 'transparent',
        display: 'flex',
        gap: '1rem',
        padding: '0.5rem 1rem',
        overflowX: 'auto',
        overflowY: 'visible',
        pointerEvents: 'none',
      }}
    >
      {players.map(({ id, player }) => {
        const isCurrentPlayer = id === currentPlayerId
        const isViewing = id === viewingPlayerId
        const isCurrentTurn = id === currentTurnPlayerId
        const battlefieldCards = getZoneCards(`battlefield-${id}`)
        const handCards = getZoneCards(`hand-${id}`)
        const graveyardCards = getZoneCards(`graveyard-${id}`)
        const exileCards = getZoneCards(`exile-${id}`)

        return (
          <div
            key={id}
            onClick={() => onSelectPlayer(id)}
            style={{
              flex: '0 0 auto',
              minWidth: '280px',
              width: '280px',
              height: '180px',
              backgroundColor: 'transparent',
              border: isCurrentTurn
                ? `3px solid ${getPlayerColor(id)}`
                : isViewing
                ? `3px solid ${getPlayerColor(id)}`
                : `2px solid ${getPlayerColor(id)}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: isViewing
                ? '0 6px 16px rgba(0,0,0,0.25)'
                : isCurrentTurn
                ? `0 0 20px ${getPlayerColor(id)}80`
                : '0 2px 8px rgba(0,0,0,0.1)',
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = isViewing
                ? '0 6px 16px rgba(0,0,0,0.25)'
                : isCurrentTurn
                ? `0 0 20px ${getPlayerColor(id)}80`
                : '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            {/* Background: Faded battlefield preview */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              <BattlefieldPreview
                cards={battlefieldCards}
                playerId={id}
                containerWidth={280}
                containerHeight={180}
              />
            </div>

            {/* Foreground: Player info overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '0.75rem',
                boxSizing: 'border-box',
                pointerEvents: 'none',
              }}
            >
              {/* Top section: Name and badges */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: getPlayerColor(id),
                    boxShadow: '0 0 8px rgba(255,255,255,0.5)',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    color: '#fff',
                  }}
                >
                  {player.name}
                </span>
                {isCurrentPlayer && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#fff',
                      fontWeight: 'normal',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    You
                  </span>
                )}
                {isCurrentTurn && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#fff',
                      fontWeight: 'bold',
                      backgroundColor: getPlayerColor(id),
                      padding: '2px 6px',
                      borderRadius: '4px',
                      animation: 'pulse 2s infinite',
                    }}
                  >
                    Turn
                  </span>
                )}
              </div>

              {/* Bottom section: Stats with icons */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  fontSize: '0.85rem',
                  color: '#fff',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  ❤️ {player.lifeTotal}
                </span>
                <span>🃏 {handCards.length}</span>
                <span>📚 {getZoneCards(`deck-${id}`).length}</span>
                <span>💀 {graveyardCards.length}</span>
                <span>🚫 {exileCards.length}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
