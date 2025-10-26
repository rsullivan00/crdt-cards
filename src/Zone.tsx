import { Card as CardComponent } from './Card'
import { Card as CardType } from './store'

interface ZoneProps {
  zoneName: string
  zoneType: string
  cards: Array<{ id: string; card: CardType }>
  playerColor: string
}

export function Zone({ zoneName, zoneType, cards, playerColor }: ZoneProps) {
  return (
    <div
      style={{
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
        minHeight: '200px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>
          {zoneName} ({zoneType})
        </h3>
        <span
          style={{
            backgroundColor: playerColor,
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}
        >
          {cards.length} cards
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          minHeight: '160px',
          alignItems: 'flex-start',
        }}
      >
        {cards.length === 0 ? (
          <div
            style={{
              color: '#999',
              fontStyle: 'italic',
              fontSize: '0.875rem',
              padding: '1rem',
            }}
          >
            No cards in this zone
          </div>
        ) : (
          cards.map(({ id, card }) => (
            <CardComponent key={id} cardId={id} card={card} playerColor={playerColor} />
          ))
        )}
      </div>
    </div>
  )
}
