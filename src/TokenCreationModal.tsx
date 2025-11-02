import { useState } from 'react'
import { createToken } from './store'

interface TokenCreationModalProps {
  playerId: string
  onClose: () => void
}

interface CommonToken {
  name: string
  displayName: string
  color: string
  emoji: string
  imageUrl: string // Hardcoded Scryfall image URL
}

const COMMON_TOKENS: CommonToken[] = [
  {
    name: 'Treasure',
    displayName: 'Treasure',
    color: '#FFD700',
    emoji: '💰',
    imageUrl: 'https://cards.scryfall.io/normal/front/d/5/d52efeb3-661d-45e9-97c3-af167f889684.jpg?1757379348'
  },
  {
    name: 'Food',
    displayName: 'Food',
    color: '#8B4513',
    emoji: '🍎',
    imageUrl: 'https://cards.scryfall.io/normal/front/0/f/0fb2c5a4-859e-40ac-8091-7ba44f57b878.jpg?1757379328'
  },
  {
    name: 'Clue',
    displayName: 'Clue',
    color: '#708090',
    emoji: '🔍',
    imageUrl: 'https://cards.scryfall.io/normal/front/1/5/15866ed4-1ca3-427f-99ba-ee26ede9ae18.jpg?1752946432'
  },
  {
    name: 'Soldier',
    displayName: '1/1 Soldier',
    color: '#F0E68C',
    emoji: '⚔️',
    imageUrl: 'https://cards.scryfall.io/normal/front/6/3/631c2c16-132d-4607-ab7e-207a6af188e5.jpg?1757686920'
  },
  {
    name: 'Zombie',
    displayName: '2/2 Zombie',
    color: '#2F4F4F',
    emoji: '🧟',
    imageUrl: 'https://cards.scryfall.io/normal/front/4/c/4cecd5c6-d6c8-4cd5-97a3-cddaf051af15.jpg?1749245686'
  },
  {
    name: 'Goblin',
    displayName: '1/1 Goblin',
    color: '#DC143C',
    emoji: '👺',
    imageUrl: 'https://cards.scryfall.io/normal/front/e/2/e265ca24-96c0-4654-a8f3-bbffe288970a.jpg?1742506636'
  },
  {
    name: 'Beast',
    displayName: '3/3 Beast',
    color: '#228B22',
    emoji: '🦁',
    imageUrl: 'https://cards.scryfall.io/normal/front/3/b/3b584d93-5681-4ecd-953c-5ef58307caab.jpg?1752946408'
  },
  {
    name: 'Spirit',
    displayName: '1/1 Spirit',
    color: '#E6E6FA',
    emoji: '👻',
    imageUrl: 'https://cards.scryfall.io/normal/front/0/0/004f2ea4-0477-49b2-ad06-5aac7991103d.jpg?1749245677'
  },
]

export function TokenCreationModal({ playerId, onClose }: TokenCreationModalProps) {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>(
    COMMON_TOKENS.reduce((acc, token) => ({ ...acc, [token.name]: 1 }), {})
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const handleCreateToken = (tokenName: string) => {
    const quantity = quantities[tokenName] || 1
    const token = COMMON_TOKENS.find(t => t.name === tokenName)
    const imageUrl = token?.imageUrl
    createToken(playerId, tokenName, quantity, imageUrl)
    onClose()
  }

  const handleQuantityChange = (tokenName: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [tokenName]: Math.max(1, Math.min(20, (prev[tokenName] || 1) + delta))
    }))
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchError('')
    setSearchResults([])

    try {
      const query = `t:token ${searchQuery.trim()}`
      const response = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints`
      )

      if (!response.ok) {
        if (response.status === 404) {
          setSearchError('No tokens found matching your search')
        } else {
          setSearchError('Failed to search Scryfall')
        }
        setIsSearching(false)
        return
      }

      const data = await response.json()
      setSearchResults(data.data || [])
    } catch (e) {
      console.error('Search error:', e)
      setSearchError('Network error - could not search Scryfall')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchResultClick = (card: any) => {
    createToken(playerId, card.name, 1)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          zIndex: 9999,
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: '1.5rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            paddingBottom: '1rem',
            borderBottom: '2px solid #ddd',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Create Tokens</h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0 0.5rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Common Tokens Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#666' }}>
            COMMON TOKENS
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {COMMON_TOKENS.map((token) => (
              <div
                key={token.name}
                style={{
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  backgroundColor: '#fafafa',
                }}
              >
                <div
                  style={{
                    fontSize: '2rem',
                    textAlign: 'center',
                  }}
                >
                  {token.emoji}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: '#333',
                  }}
                >
                  {token.displayName}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <button
                    onClick={() => handleQuantityChange(token.name, -1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      width: '32px',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {quantities[token.name] || 1}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(token.name, 1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                    }}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => handleCreateToken(token.name)}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  Create
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Search Section */}
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#666' }}>
            SEARCH SCRYFALL
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="text"
              placeholder="Search token name (e.g., dragon, elf)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '2px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isSearching ? '#ccc' : '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSearching ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 'bold',
              }}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchError && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: '#ffebee',
                color: '#c62828',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            >
              {searchError}
            </div>
          )}

          {searchResults.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '0.5rem',
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '0.5rem',
              }}
            >
              {searchResults.slice(0, 20).map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleSearchResultClick(card)}
                  style={{
                    cursor: 'pointer',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.borderColor = '#2196F3'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.borderColor = '#ddd'
                  }}
                >
                  {card.image_uris?.small ? (
                    <img
                      src={card.image_uris.small}
                      alt={card.name}
                      style={{
                        width: '100%',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        aspectRatio: '5/7',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        color: '#999',
                        padding: '0.5rem',
                        textAlign: 'center',
                      }}
                    >
                      {card.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
