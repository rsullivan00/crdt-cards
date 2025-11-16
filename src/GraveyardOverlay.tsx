import { useState } from 'react'
import { Zone } from './Zone'
import { Card as CardType } from './store'
import { ZoneSearchBar } from './ZoneSearchBar'

interface GraveyardOverlayProps {
  isOpen: boolean
  onClose: () => void
  cards: Array<{ id: string; card: CardType }>
  playerColor: string
  playerId: string
  isInteractive: boolean
  viewerPlayerId: string
}

export function GraveyardOverlay({
  isOpen,
  onClose,
  cards,
  playerColor,
  playerId,
  isInteractive,
  viewerPlayerId,
}: GraveyardOverlayProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter cards based on search term
  const filteredCards = searchTerm
    ? cards.filter(({ card }) => {
        const name = card.metadata?.name || card.oracleId
        return name.toLowerCase().includes(searchTerm.toLowerCase())
      })
    : cards

  return (
    <div
      style={{
        height: isOpen ? '200px' : '0',
        overflow: 'hidden',
        transition: 'height 0.3s ease',
        flexShrink: 0,
        backgroundColor: '#fff',
        borderTop: isOpen ? '2px solid #757575' : 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.5rem 1rem',
          borderBottom: '2px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f9f9f9',
          gap: '0.5rem',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', flex: 1 }}>
          💀 Graveyard ({cards.length} {cards.length === 1 ? 'card' : 'cards'}
          {searchTerm && `, showing ${filteredCards.length}`})
        </h3>
        <ZoneSearchBar
          isOpen={searchOpen}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onToggle={() => setSearchOpen(!searchOpen)}
          resultCount={filteredCards.length}
          totalCount={cards.length}
        />
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

      {/* Zone Content */}
      <div
        style={{
          height: 'calc(200px - 48px)',
          overflow: 'visible',
          padding: '0.5rem',
        }}
      >
        <Zone
          zoneId={`graveyard-${playerId}`}
          zoneName=""
          zoneType="graveyard"
          cards={filteredCards}
          playerColor={playerColor}
          playerId={playerId}
          isInteractive={isInteractive}
          viewerPlayerId={viewerPlayerId}
          showHeader={false}
        />
      </div>
    </div>
  )
}
