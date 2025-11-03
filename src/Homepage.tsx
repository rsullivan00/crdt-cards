import { useState } from 'react'

// Word lists for generating friendly room names
const ADJECTIVES = [
  'swift', 'brave', 'wise', 'mighty', 'clever', 'bold', 'noble', 'fierce',
  'mystic', 'ancient', 'silver', 'golden', 'crimson', 'azure', 'emerald',
  'shadow', 'thunder', 'frost', 'flame', 'storm', 'lunar', 'solar',
]

const NOUNS = [
  'dragon', 'phoenix', 'griffin', 'wizard', 'knight', 'mage', 'sage',
  'warrior', 'ranger', 'paladin', 'rogue', 'sorcerer', 'champion',
  'guardian', 'sentinel', 'warden', 'keeper', 'seeker', 'voyager',
]

/**
 * Generate a friendly room name like "swift-dragon-7234"
 */
function generateRoomName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const number = Math.floor(1000 + Math.random() * 9000) // 4-digit number
  return `${adjective}-${noun}-${number}`
}

export function Homepage() {
  const [suggestedRoom, setSuggestedRoom] = useState(generateRoomName())
  const [customRoom, setCustomRoom] = useState('')

  const handleCreateRoom = () => {
    window.location.hash = suggestedRoom
  }

  const handleJoinCustomRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (customRoom.trim()) {
      // Sanitize room name: lowercase, alphanumeric + hyphens only
      const sanitized = customRoom.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      window.location.hash = sanitized
    }
  }

  const handleRefreshRoomName = () => {
    setSuggestedRoom(generateRoomName())
  }

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          padding: '3rem',
          maxWidth: '600px',
          width: '100%',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: '2.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🎴 {window.location.host}
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '1.1rem' }}>
            Real-time multiplayer card game
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            <a
              href="https://github.com/rsullivan00/crdt-cards/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#667eea', textDecoration: 'none' }}
            >
              View code & report bugs on GitHub →
            </a>
          </p>
        </div>

        {/* What is this? */}
        <div
          style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#333' }}>
            ✨ What is this?
          </h2>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#555', lineHeight: '1.6' }}>
            <li>Play Magic-style card games with friends in real-time</li>
            <li>No server required - uses peer-to-peer technology (CRDTs)</li>
            <li>Import decks from Moxfield, Archidekt, or use starter decks</li>
            <li>Everything syncs instantly across all players</li>
          </ul>
        </div>

        {/* Create Room Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#333' }}>
            🚀 Create a New Room
          </h2>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <input
              type="text"
              value={suggestedRoom}
              readOnly
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                backgroundColor: '#f8f9fa',
                fontFamily: 'monospace',
              }}
            />
            <button
              onClick={handleRefreshRoomName}
              style={{
                padding: '0.75rem',
                fontSize: '1.25rem',
                backgroundColor: '#f8f9fa',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e9ecef'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa'
              }}
              title="Generate new room name"
            >
              🔄
            </button>
          </div>
          <button
            onClick={handleCreateRoom}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Create Room & Invite Friends
          </button>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#888', textAlign: 'center' }}>
            Share the URL with friends to play together
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            backgroundColor: '#e0e0e0',
            margin: '2rem 0',
          }}
        />

        {/* Join Existing Room */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#333' }}>
            🔗 Join Existing Room
          </h2>
          <form onSubmit={handleJoinCustomRoom}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
                placeholder="Enter room name..."
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                }}
              />
              <button
                type="submit"
                disabled={!customRoom.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  backgroundColor: customRoom.trim() ? '#4CAF50' : '#e0e0e0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: customRoom.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s',
                }}
              >
                Join
              </button>
            </div>
          </form>
        </div>

        {/* Important Info */}
        <div
          style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '6px',
            padding: '1rem',
            fontSize: '0.9rem',
            color: '#856404',
          }}
        >
          <strong>⚠️ Important:</strong> Rooms are temporary and ephemeral. All game data is
          deleted when the last player leaves. Make sure to finish your game in one session!
        </div>
      </div>
    </div>
  )
}
