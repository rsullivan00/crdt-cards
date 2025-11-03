import { PlayerQuadrant } from './PlayerQuadrant'
import { Card as CardType, Player, getTurnBaton } from './store'

interface TableLayoutProps {
  players: Array<{ id: string; player: Player }>
  currentPlayerId: string
  getZoneCards: (zoneId: string) => Array<{ id: string; card: CardType }>
  onDrawCards: (playerId: string, count: number) => void
  onMillCards: (playerId: string, count: number) => void
  onExileFromDeck: (playerId: string, count: number, faceDown: boolean) => void
  onShuffleDeck: (playerId: string) => void
  onRevealTopCard: (playerId: string) => void
  onOpenGraveyard: (playerId: string) => void
  onOpenExile: (playerId: string) => void
  onOpenDeck: (playerId: string) => void
  onCreateToken: (playerId: string) => void
  revealedCard: { cardName: string; revealedBy: string } | null
}

export function TableLayout({
  players,
  currentPlayerId,
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
  revealedCard,
}: TableLayoutProps) {
  const baton = getTurnBaton()
  const currentTurnPlayerId = baton?.playerId

  // Arrange players: current player at bottom, others distributed
  const currentPlayerData = players.find(p => p.id === currentPlayerId)
  const otherPlayers = players.filter(p => p.id !== currentPlayerId)
  
  const playerCount = players.length
  
  // Determine layout based on player count
  const getLayout = () => {
    if (playerCount === 1) {
      // Just one player - bottom only
      return {
        bottom: currentPlayerData,
        top: null,
        left: null,
        right: null,
      }
    } else if (playerCount === 2) {
      // Two players - top and bottom (split screen)
      return {
        bottom: currentPlayerData,
        top: otherPlayers[0],
        left: null,
        right: null,
      }
    } else if (playerCount === 3) {
      // Three players - bottom, top-left, top-right
      return {
        bottom: currentPlayerData,
        top: null,
        left: otherPlayers[0],
        right: otherPlayers[1],
      }
    } else {
      // Four players - full quadrants
      return {
        bottom: currentPlayerData,
        top: otherPlayers[1],
        left: otherPlayers[0],
        right: otherPlayers[2],
      }
    }
  }

  const layout = getLayout()

  // For 2 players: use vertical split
  // For 3+ players: use grid
  const isTwoPlayerLayout = playerCount === 2
  const isThreePlayerLayout = playerCount === 3

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: isTwoPlayerLayout ? '1fr' : '1fr 1fr',
        gridTemplateRows: isTwoPlayerLayout ? '1fr 1fr' : isThreePlayerLayout ? '1fr 1fr' : '1fr 1fr',
        gap: '0px',
        overflow: 'hidden',
      }}
    >
      {/* Top Section */}
      {isTwoPlayerLayout ? (
        // 2 players: top half
        layout.top && (
          <div style={{ gridColumn: '1', gridRow: '1' }}>
            <PlayerQuadrant
              playerId={layout.top.id}
              player={layout.top.player}
              currentPlayerId={currentPlayerId}
              isCurrentPlayer={false}
              position="top"
              getZoneCards={getZoneCards}
              onDrawCards={(count) => onDrawCards(layout.top!.id, count)}
              onMillCards={(count) => onMillCards(layout.top!.id, count)}
              onExileFromDeck={(count, faceDown) => onExileFromDeck(layout.top!.id, count, faceDown)}
              onShuffleDeck={() => onShuffleDeck(layout.top!.id)}
              onRevealTopCard={() => onRevealTopCard(layout.top!.id)}
              onOpenGraveyard={() => onOpenGraveyard(layout.top!.id)}
              onOpenExile={() => onOpenExile(layout.top!.id)}
              onOpenDeck={() => onOpenDeck(layout.top!.id)}
              onCreateToken={() => onCreateToken(layout.top!.id)}
              isCurrentTurn={currentTurnPlayerId === layout.top.id}
              revealedCard={revealedCard}
            />
          </div>
        )
      ) : (
        // 3+ players: top-left and top-right
        <>
          {layout.left && (
            <div style={{ gridColumn: '1', gridRow: '1' }}>
              <PlayerQuadrant
                playerId={layout.left.id}
                player={layout.left.player}
                currentPlayerId={currentPlayerId}
                isCurrentPlayer={false}
                position={isThreePlayerLayout ? 'top' : 'left'}
                getZoneCards={getZoneCards}
                onDrawCards={(count) => onDrawCards(layout.left!.id, count)}
                onMillCards={(count) => onMillCards(layout.left!.id, count)}
                onExileFromDeck={(count, faceDown) => onExileFromDeck(layout.left!.id, count, faceDown)}
                onShuffleDeck={() => onShuffleDeck(layout.left!.id)}
                onRevealTopCard={() => onRevealTopCard(layout.left!.id)}
                onOpenGraveyard={() => onOpenGraveyard(layout.left!.id)}
                onOpenExile={() => onOpenExile(layout.left!.id)}
                onOpenDeck={() => onOpenDeck(layout.left!.id)}
                onCreateToken={() => onCreateToken(layout.left!.id)}
                isCurrentTurn={currentTurnPlayerId === layout.left.id}
                revealedCard={revealedCard}
              />
            </div>
          )}
          {layout.right && (
            <div style={{ gridColumn: '2', gridRow: '1' }}>
              <PlayerQuadrant
                playerId={layout.right.id}
                player={layout.right.player}
                currentPlayerId={currentPlayerId}
                isCurrentPlayer={false}
                position={isThreePlayerLayout ? 'top' : 'right'}
                getZoneCards={getZoneCards}
                onDrawCards={(count) => onDrawCards(layout.right!.id, count)}
                onMillCards={(count) => onMillCards(layout.right!.id, count)}
                onExileFromDeck={(count, faceDown) => onExileFromDeck(layout.right!.id, count, faceDown)}
                onShuffleDeck={() => onShuffleDeck(layout.right!.id)}
                onRevealTopCard={() => onRevealTopCard(layout.right!.id)}
                onOpenGraveyard={() => onOpenGraveyard(layout.right!.id)}
                onOpenExile={() => onOpenExile(layout.right!.id)}
                onOpenDeck={() => onOpenDeck(layout.right!.id)}
                onCreateToken={() => onCreateToken(layout.right!.id)}
                isCurrentTurn={currentTurnPlayerId === layout.right.id}
                revealedCard={revealedCard}
              />
            </div>
          )}
          {layout.top && (
            <div style={{ gridColumn: '1 / 3', gridRow: '1' }}>
              <PlayerQuadrant
                playerId={layout.top.id}
                player={layout.top.player}
                currentPlayerId={currentPlayerId}
                isCurrentPlayer={false}
                position="top"
                getZoneCards={getZoneCards}
                onDrawCards={(count) => onDrawCards(layout.top!.id, count)}
                onMillCards={(count) => onMillCards(layout.top!.id, count)}
                onExileFromDeck={(count, faceDown) => onExileFromDeck(layout.top!.id, count, faceDown)}
                onShuffleDeck={() => onShuffleDeck(layout.top!.id)}
                onRevealTopCard={() => onRevealTopCard(layout.top!.id)}
                onOpenGraveyard={() => onOpenGraveyard(layout.top!.id)}
                onOpenExile={() => onOpenExile(layout.top!.id)}
                onOpenDeck={() => onOpenDeck(layout.top!.id)}
                onCreateToken={() => onCreateToken(layout.top!.id)}
                isCurrentTurn={currentTurnPlayerId === layout.top.id}
                revealedCard={revealedCard}
              />
            </div>
          )}
        </>
      )}

      {/* Bottom Section - Current Player */}
      {layout.bottom && (
        <div
          style={{
            gridColumn: isTwoPlayerLayout ? '1' : '1 / 3',
            gridRow: '2',
          }}
        >
          <PlayerQuadrant
            playerId={layout.bottom.id}
            player={layout.bottom.player}
            currentPlayerId={currentPlayerId}
            isCurrentPlayer={true}
            position="bottom"
            getZoneCards={getZoneCards}
            onDrawCards={(count) => onDrawCards(layout.bottom!.id, count)}
            onMillCards={(count) => onMillCards(layout.bottom!.id, count)}
            onExileFromDeck={(count, faceDown) => onExileFromDeck(layout.bottom!.id, count, faceDown)}
            onShuffleDeck={() => onShuffleDeck(layout.bottom!.id)}
            onRevealTopCard={() => onRevealTopCard(layout.bottom!.id)}
            onOpenGraveyard={() => onOpenGraveyard(layout.bottom!.id)}
            onOpenExile={() => onOpenExile(layout.bottom!.id)}
            onOpenDeck={() => onOpenDeck(layout.bottom!.id)}
            onCreateToken={() => onCreateToken(layout.bottom!.id)}
            isCurrentTurn={currentTurnPlayerId === layout.bottom.id}
            revealedCard={revealedCard}
          />
        </div>
      )}

      {/* Add keyframe animation for pulse effect */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 20px var(--pulse-color, #2196F3)80;
          }
          50% {
            box-shadow: 0 0 40px var(--pulse-color, #2196F3)ff;
          }
        }
      `}</style>
    </div>
  )
}
