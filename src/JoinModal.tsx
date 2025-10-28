import { useState, useEffect, useRef } from 'react'
import {
  StoredDeck,
  getStoredDecks,
  getLastUsedDeckId,
  importDeckFromMoxfield,
  deleteDeck,
} from './store'

interface JoinModalProps {
  onJoin: (name: string, deckId?: string) => void
  playerCount: number
}

const USERNAME_STORAGE_KEY = 'crdt-cards-username'

export function JoinModal({ onJoin, playerCount }: JoinModalProps) {
  const [name, setName] = useState('')
  const [storedDecks, setStoredDecks] = useState<StoredDeck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string>('')
  const [showImportField, setShowImportField] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Load saved username and decks on mount
  useEffect(() => {
    const savedName = localStorage.getItem(USERNAME_STORAGE_KEY)
    if (savedName) {
      setName(savedName)
      // Select the text for easy editing
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.select()
        }
      }, 100)
    }

    // Load stored decks
    const decks = getStoredDecks()
    setStoredDecks(decks)

    // Auto-select last used deck
    const lastDeckId = getLastUsedDeckId()
    if (lastDeckId && decks.find(d => d.id === lastDeckId)) {
      setSelectedDeckId(lastDeckId)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onJoin(name.trim(), selectedDeckId || undefined)
    }
  }

  const handleImport = async () => {
    if (!importUrl.trim()) return

    setIsImporting(true)
    setImportError('')

    const result = await importDeckFromMoxfield(importUrl.trim())

    if (result.success && result.deck) {
      // Reload decks and select the new one
      const decks = getStoredDecks()
      setStoredDecks(decks)
      setSelectedDeckId(result.deck.id)
      setShowImportField(false)
      setImportUrl('')
    } else {
      setImportError(result.error || 'Failed to import deck')
    }

    setIsImporting(false)
  }

  const handleDeleteDeck = (deckId: string) => {
    if (confirm('Delete this deck from your library?')) {
      deleteDeck(deckId)
      const decks = getStoredDecks()
      setStoredDecks(decks)
      if (selectedDeckId === deckId) {
        setSelectedDeckId('')
      }
    }
  }

  const selectedDeck = storedDecks.find(d => d.id === selectedDeckId)
  const isFull = playerCount >= 4

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1rem', textAlign: 'center' }}>
          🎴 Join Game
        </h2>

        {isFull ? (
          <div>
            <p style={{ textAlign: 'center', color: '#F44336', marginBottom: '1rem' }}>
              This game is full (4/4 players)
            </p>
            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>
              Please try a different room or wait for a player to leave.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ marginBottom: '1rem', textAlign: 'center', color: '#666' }}>
              Players in room: {playerCount}/4
            </p>

            {/* Player Name */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="player-name"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}
              >
                Your Name
              </label>
              <input
                ref={inputRef}
                id="player-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                autoFocus
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2196F3'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ddd'
                }}
              />
            </div>

            {/* Deck Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="deck-select"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                }}
              >
                Deck (Optional)
              </label>
              <select
                id="deck-select"
                value={selectedDeckId}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '__import__') {
                    setShowImportField(true)
                    setSelectedDeckId('')
                  } else {
                    setSelectedDeckId(value)
                    setShowImportField(false)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  backgroundColor: 'white',
                }}
              >
                <option value="">No deck (use sample cards)</option>
                {storedDecks.map(deck => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name} ({deck.cardCount} cards)
                  </option>
                ))}
                <option value="__import__">+ Import New Deck...</option>
              </select>

              {/* Show selected deck info */}
              {selectedDeck && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: '#666' }}>
                    {selectedDeck.cardCount} cards • Will draw 7 on join
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteDeck(selectedDeck.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#F44336',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Import Field */}
            {showImportField && (
              <div
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                }}
              >
                <label
                  htmlFor="import-url"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                  }}
                >
                  Moxfield Deck URL
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="import-url"
                    type="text"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://www.moxfield.com/decks/..."
                    disabled={isImporting}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      fontSize: '0.875rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!importUrl.trim() || isImporting}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      backgroundColor: importUrl.trim() && !isImporting ? '#2196F3' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: importUrl.trim() && !isImporting ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {isImporting ? 'Importing...' : 'Import'}
                  </button>
                </div>
                {importError && (
                  <p style={{ marginTop: '0.5rem', marginBottom: 0, color: '#F44336', fontSize: '0.75rem' }}>
                    {importError}
                  </p>
                )}
                <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.75rem', color: '#666' }}>
                  Deck will be saved to your library for reuse
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: name.trim() ? '#4CAF50' : '#ccc',
                border: 'none',
                borderRadius: '6px',
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (name.trim()) {
                  e.currentTarget.style.backgroundColor = '#45a049'
                }
              }}
              onMouseLeave={(e) => {
                if (name.trim()) {
                  e.currentTarget.style.backgroundColor = '#4CAF50'
                }
              }}
            >
              Join Game
            </button>
          </form>
        )}

        <p style={{ marginTop: '1.5rem', marginBottom: 0, fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
          Share the URL with friends to play together!
        </p>
      </div>
    </div>
  )
}
