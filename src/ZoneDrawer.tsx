import { useState } from 'react'
import { Zone } from './Zone'
import { Card as CardType } from './store'
import { ZoneSearchBar } from './ZoneSearchBar'

interface ZoneDrawerProps {
  isOpen: boolean
  onClose: () => void
  graveyardCards: Array<{ id: string; card: CardType }>
  exileCards: Array<{ id: string; card: CardType }>
  playerColor: string
  playerId: string
  isInteractive: boolean
  viewerPlayerId: string
}

export function ZoneDrawer({
  isOpen,
  onClose,
  graveyardCards,
  exileCards,
  playerColor,
  playerId,
  isInteractive,
  viewerPlayerId,
}: ZoneDrawerProps) {
  const [graveyardSearchOpen, setGraveyardSearchOpen] = useState(false)
  const [graveyardSearchTerm, setGraveyardSearchTerm] = useState('')
  const [exileSearchOpen, setExileSearchOpen] = useState(false)
  const [exileSearchTerm, setExileSearchTerm] = useState('')

  // Filter cards based on search terms
  const filteredGraveyardCards = graveyardSearchTerm
    ? graveyardCards.filter(({ card }) => {
        const name = card.metadata?.name || card.oracleId
        return name.toLowerCase().includes(graveyardSearchTerm.toLowerCase())
      })
    : graveyardCards

  const filteredExileCards = exileSearchTerm
    ? exileCards.filter(({ card }) => {
        const name = card.metadata?.name || card.oracleId
        return name.toLowerCase().includes(exileSearchTerm.toLowerCase())
      })
    : exileCards

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: '40vh',
          maxHeight: '400px',
          backgroundColor: '#fff',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInUp 0.3s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem',
            borderBottom: '2px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>📜 Graveyard & Exile</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
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

        {/* Zones Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            padding: '1rem',
          }}
        >
          {/* Graveyard Zone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f9f9f9',
                borderRadius: '6px',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', flex: 1 }}>
                💀 Graveyard ({graveyardCards.length}
                {graveyardSearchTerm && `, showing ${filteredGraveyardCards.length}`})
              </h4>
              <ZoneSearchBar
                isOpen={graveyardSearchOpen}
                searchTerm={graveyardSearchTerm}
                onSearchChange={setGraveyardSearchTerm}
                onToggle={() => setGraveyardSearchOpen(!graveyardSearchOpen)}
                resultCount={filteredGraveyardCards.length}
                totalCount={graveyardCards.length}
              />
            </div>
            <Zone
              zoneId={`graveyard-${playerId}`}
              zoneName=""
              zoneType="graveyard"
              cards={filteredGraveyardCards}
              playerColor={playerColor}
              playerId={playerId}
              isInteractive={isInteractive}
              viewerPlayerId={viewerPlayerId}
              showHeader={false}
            />
          </div>

          {/* Exile Zone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f9f9f9',
                borderRadius: '6px',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', flex: 1 }}>
                🚫 Exile ({exileCards.length}
                {exileSearchTerm && `, showing ${filteredExileCards.length}`})
              </h4>
              <ZoneSearchBar
                isOpen={exileSearchOpen}
                searchTerm={exileSearchTerm}
                onSearchChange={setExileSearchTerm}
                onToggle={() => setExileSearchOpen(!exileSearchOpen)}
                resultCount={filteredExileCards.length}
                totalCount={exileCards.length}
              />
            </div>
            <Zone
              zoneId={`exile-${playerId}`}
              zoneName=""
              zoneType="exile"
              cards={filteredExileCards}
              playerColor={playerColor}
              playerId={playerId}
              isInteractive={isInteractive}
              viewerPlayerId={viewerPlayerId}
              showHeader={false}
            />
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
