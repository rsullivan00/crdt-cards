import { Card as CardType } from './store'

interface CardProps {
  card: CardType
  cardId: string
  playerColor: string
}

export function Card({ card, cardId, playerColor }: CardProps) {
  const cardStyle: React.CSSProperties = {
    width: '120px',
    height: '160px',
    border: `3px solid ${playerColor}`,
    borderRadius: '8px',
    backgroundColor: card.faceDown ? '#333' : '#fff',
    padding: '0.5rem',
    position: 'relative',
    transition: 'transform 0.3s ease',
    transform: card.tapped ? 'rotate(90deg)' : 'rotate(0deg)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }

  const cardBackStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    color: '#666',
  }

  const counterBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '5px',
    right: '5px',
    backgroundColor: '#FF5722',
    color: 'white',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  }

  const attachmentIndicatorStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '5px',
    right: '5px',
    backgroundColor: '#9C27B0',
    color: 'white',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
  }

  const totalCounters = Array.from(card.counters.values()).reduce((sum, count) => sum + count, 0)

  if (card.faceDown) {
    return (
      <div style={cardStyle} title={`Card ${cardId} (face down)`}>
        <div style={cardBackStyle}>🂠</div>
      </div>
    )
  }

  return (
    <div style={cardStyle} title={`Card ${cardId}`}>
      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', wordBreak: 'break-all' }}>
        {card.oracleId}
      </div>

      <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.25rem' }}>
        ID: {cardId.slice(0, 8)}
      </div>

      {card.tapped && (
        <div style={{ fontSize: '0.7rem', color: '#FF5722', fontWeight: 'bold', marginTop: '0.25rem' }}>
          ⭯ TAPPED
        </div>
      )}

      {totalCounters > 0 && (
        <div style={counterBadgeStyle} title={`${totalCounters} counters`}>
          {totalCounters}
        </div>
      )}

      {card.attachments.length > 0 && (
        <div style={attachmentIndicatorStyle} title={`${card.attachments.length} attachments`}>
          +{card.attachments.length}
        </div>
      )}

      <div style={{ fontSize: '0.6rem', color: '#999', marginTop: 'auto' }}>
        v{card.v}
      </div>
    </div>
  )
}
