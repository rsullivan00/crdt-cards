import { Zone } from './Zone'
import { CompactDeck } from './CompactDeck'
import { CompactLifeCounter } from './CompactLifeCounter'
import { Card as CardType, Player, getPlayerColor } from './store'

interface PlayerQuadrantProps {
  playerId: string
  player: Player
  currentPlayerId: string
  isCurrentPlayer: boolean
  position: 'bottom' | 'top' | 'left' | 'right'
  getZoneCards: (zoneId: string) => Array<{ id: string; card: CardType }>
  onDrawCards: (count: number) => void
  onMillCards: (count: number) => void
  onExileFromDeck: (count: number, faceDown: boolean) => void
  onShuffleDeck: () => void
  onRevealTopCard: () => void
  onOpenGraveyard: () => void
  onOpenExile: () => void
  onOpenDeck: () => void
  onCreateToken: () => void
  isCurrentTurn: boolean
  revealedCard: { cardName: string; revealedBy: string } | null
}

export function PlayerQuadrant({
  playerId,
  player,
  currentPlayerId,
  isCurrentPlayer,
  position,
  getZoneCards,
  onDrawCards,
  onMillCards,
  onExileFromDeck,
  onShuffleDeck,
  onRevealTopCard,
  onOpenGraveyard,
  onOpenExile,
  onOpenDeck,
  onCreateToken,
  isCurrentTurn,
  revealedCard,
}: PlayerQuadrantProps) {
  const playerColor = getPlayerColor(playerId)
  const isInteractive = isCurrentPlayer

  // Opponents should only show battlefield (no hand/deck controls)
  // Only current player shows full controls
  const showFullControls = isCurrentPlayer

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        border: isCurrentTurn ? `4px solid ${playerColor}` : '2px solid #ddd',
        backgroundColor: '#f9f9f9',
        boxShadow: isCurrentTurn ? `0 0 20px ${playerColor}80` : 'none',
        animation: isCurrentTurn ? 'pulse 2s infinite' : 'none',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Player Name Header */}
      <div
        style={{
          backgroundColor: playerColor,
          color: 'white',
          padding: '0.5rem',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '0.875rem',
          borderBottom: '2px solid rgba(0,0,0,0.1)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <div style={{ flex: 1, textAlign: 'center' }}>
          {player.name} {isCurrentPlayer && '(You)'}
          {isCurrentTurn && ' 🎯'}
        </div>

        {/* Opponent stats and zone buttons */}
        {!isCurrentPlayer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 'bold' }}>
              ❤️ {player.lifeTotal}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
              🃏 {getZoneCards(`hand-${playerId}`).length}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenGraveyard()
              }}
              style={{
                padding: '0.2rem 0.4rem',
                fontSize: '0.65rem',
                backgroundColor: 'rgba(0,0,0,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
              title="View Graveyard"
            >
              💀 {getZoneCards(`graveyard-${playerId}`).length}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenExile()
              }}
              style={{
                padding: '0.2rem 0.4rem',
                fontSize: '0.65rem',
                backgroundColor: 'rgba(0,0,0,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
              title="View Exile"
            >
              🚫 {getZoneCards(`exile-${playerId}`).length}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenDeck()
              }}
              style={{
                padding: '0.2rem 0.4rem',
                fontSize: '0.65rem',
                backgroundColor: 'rgba(0,0,0,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
              title="View Deck"
            >
              📚 {getZoneCards(`deck-${playerId}`).length}
            </button>
          </div>
        )}
      </div>

      {/* Main play area - zones in correct order */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* For opponents at top: Hand first, then battlefield */}
        {/* For current player: Battlefield first, then hand+controls */}

        {!showFullControls ? (
          /* Opponent layout - battlefield only */
          <>
            {/* Battlefield Zone (directly under header) */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                minHeight: 0,
              }}
            >
              <Zone
                zoneId={`battlefield-${playerId}`}
                zoneName="Battlefield"
                zoneType="battlefield"
                cards={getZoneCards(`battlefield-${playerId}`)}
                playerColor={playerColor}
                playerId={playerId}
                isInteractive={isInteractive}
                viewerPlayerId={currentPlayerId}
                opponentPosition={position === 'top' ? 'top' : null}
              />
            </div>
          </>
        ) : (
          /* Current player layout */
          <>
            {/* Battlefield Zone (at top) */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                minHeight: 0,
              }}
            >
              <Zone
                zoneId={`battlefield-${playerId}`}
                zoneName="Battlefield"
                zoneType="battlefield"
                cards={getZoneCards(`battlefield-${playerId}`)}
                playerColor={playerColor}
                playerId={playerId}
                isInteractive={isInteractive}
                viewerPlayerId={currentPlayerId}
              />
            </div>

            {/* Bottom Bar: Hand + Deck + Life Counter + Buttons */}
            <div
              style={{
                flexShrink: 0,
                borderTop: '2px solid #ddd',
                backgroundColor: '#f5f5f5',
                padding: '0.5rem',
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: '0.5rem',
                alignItems: 'center',
              }}
            >
              {/* Hand Zone */}
              <div style={{ minWidth: 0, overflow: 'visible' }}>
                <Zone
                  zoneId={`hand-${playerId}`}
                  zoneName="Hand"
                  zoneType="hand"
                  cards={getZoneCards(`hand-${playerId}`)}
                  playerColor={playerColor}
                  playerId={playerId}
                  isInteractive={isInteractive}
                  viewerPlayerId={currentPlayerId}
                />
              </div>

              {/* Deck */}
              <CompactDeck
                cardCount={getZoneCards(`deck-${playerId}`).length}
                playerColor={playerColor}
                playerId={playerId}
                revealedCard={revealedCard}
                onDrawOne={() => onDrawCards(1)}
                onDrawN={onDrawCards}
                onMillOne={() => onMillCards(1)}
                onMillN={onMillCards}
                onExileOne={(faceDown) => onExileFromDeck(1, faceDown)}
                onExileN={(count, faceDown) => onExileFromDeck(count, faceDown)}
                onShuffle={onShuffleDeck}
                onRevealTop={onRevealTopCard}
              />

              {/* Life Counter + Buttons Column */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {/* Life Counter */}
                <CompactLifeCounter
                  playerId={playerId}
                  lifeTotal={player.lifeTotal}
                  playerColor={playerColor}
                  currentPlayerId={currentPlayerId}
                />

                {/* Zone Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={onOpenGraveyard}
                    style={{
                      width: '50px',
                      height: '40px',
                      borderRadius: '6px',
                      backgroundColor: '#9C27B0',
                      color: 'white',
                      border: 'none',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s',
                    }}
                    title="Graveyard"
                  >
                    💀
                  </button>
                  <button
                    onClick={onOpenExile}
                    style={{
                      width: '50px',
                      height: '40px',
                      borderRadius: '6px',
                      backgroundColor: '#9C27B0',
                      color: 'white',
                      border: 'none',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s',
                    }}
                    title="Exile"
                  >
                    🚫
                  </button>
                  <button
                    onClick={onCreateToken}
                    style={{
                      width: '50px',
                      height: '40px',
                      borderRadius: '6px',
                      backgroundColor: '#FF9800',
                      color: 'white',
                      border: 'none',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s',
                    }}
                    title="Create Token"
                  >
                    🪙
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
