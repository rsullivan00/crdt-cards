import { useState, useEffect, useRef } from 'react'
import { logArray, playersMap, cardsMap, zonesMap, getPlayerColor, sendChatMessage, GameEvent } from './store'

type FilterMode = 'all' | 'chat' | 'game'

interface ChatLogProps {
  currentPlayerId: string
}

export function ChatLog({ currentPlayerId }: ChatLogProps) {
  const [events, setEvents] = useState<GameEvent[]>([])
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [message, setMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateEvents = () => {
      const allEvents: GameEvent[] = []
      logArray.forEach((event) => {
        allEvents.push(event)
      })
      setEvents(allEvents)
    }

    logArray.observe(updateEvents)
    updateEvents()

    return () => {
      logArray.unobserve(updateEvents)
    }
  }, [])

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      sendChatMessage(currentPlayerId, message.trim())
      setMessage('')
    }
  }

  const prettifyZone = (zoneId: string): string => {
    const zone = zonesMap.get(zoneId)
    if (!zone) return zoneId
    return zone.type.charAt(0).toUpperCase() + zone.type.slice(1)
  }

  const formatEvent = (event: GameEvent): string => {
    const player = playersMap.get(event.playerId)
    const playerName = player?.name || 'Unknown'

    if (event.type === 'chat' && event.action === 'chat_message') {
      return event.data.message
    }

    // Format game events
    switch (event.action) {
      case 'player_joined':
        return `${playerName} joined the game`
      case 'player_removed':
        return `${playerName} left the game`
      case 'turn_changed':
        return `${playerName}'s turn - ${event.data.step}`
      case 'draw_cards':
        return `${playerName} drew ${event.data.count} card${event.data.count !== 1 ? 's' : ''}`
      case 'mill_cards':
        return `${playerName} milled ${event.data.count} card${event.data.count !== 1 ? 's' : ''}`
      case 'exile_from_deck':
        return `${playerName} exiled ${event.data.count} card${event.data.count !== 1 ? 's' : ''} from deck`
      case 'shuffle_deck':
        return `${playerName} shuffled their deck`
      case 'card_moved': {
        const cardName = event.data.oracleId || 'a card'
        const toZone = prettifyZone(event.data.to)
        const fromZone = prettifyZone(event.data.from)

        if (fromZone === toZone) {
          return `${playerName} moved ${cardName}`
        }
        return `${playerName} moved ${cardName} from ${fromZone} to ${toZone}`
      }
      case 'counter_modified': {
        const cardName = event.data.oracleId || 'a card'
        const counterType = event.data.counterType
        const delta = event.data.delta
        const newValue = event.data.newValue

        if (delta > 0) {
          const article = delta === 1 ? 'a' : delta
          return `${playerName} added ${article} ${counterType} counter${delta !== 1 ? 's' : ''} to ${cardName} (${newValue} total)`
        } else {
          const count = Math.abs(delta)
          return `${playerName} removed ${count} ${counterType} counter${count !== 1 ? 's' : ''} from ${cardName} (${newValue} total)`
        }
      }
      case 'card_updated':
        if (event.data.updates?.tapped !== undefined) {
          const cardName = event.data.oracleId || 'a card'
          return `${playerName} ${event.data.updates.tapped ? 'tapped' : 'untapped'} ${cardName}`
        }
        if (event.data.updates?.faceDown !== undefined) {
          const cardName = event.data.oracleId || 'a card'
          return `${playerName} ${event.data.updates.faceDown ? 'turned face down' : 'turned face up'} ${cardName}`
        }
        return `${playerName} updated a card`
      case 'life_total_modified':
        const delta = event.data.delta
        const sign = delta > 0 ? '+' : ''
        return `${playerName} ${delta > 0 ? 'gained' : 'lost'} ${Math.abs(delta)} life (${sign}${delta} → ${event.data.newTotal})`
      case 'life_total_set':
        return `${playerName} set life to ${event.data.newTotal}`
      default:
        return `${playerName}: ${event.action}`
    }
  }

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const filteredEvents = events.filter((event) => {
    if (filterMode === 'all') return true
    if (filterMode === 'chat') return event.type === 'chat'
    if (filterMode === 'game') return event.type === 'game' || !event.type
    return true
  })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#fff',
      }}
    >
      {/* Header with filter tabs */}
      <div
        style={{
          borderBottom: '2px solid #e0e0e0',
          padding: '0.75rem',
        }}
      >
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#666' }}>
          CHAT & LOG
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['all', 'chat', 'game'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                flex: 1,
                padding: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                backgroundColor: filterMode === mode ? '#2196F3' : '#f5f5f5',
                color: filterMode === mode ? 'white' : '#666',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {mode === 'all' ? 'All' : mode === 'chat' ? 'Chat' : 'Game Log'}
            </button>
          ))}
        </div>
      </div>

      {/* Events list */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {filteredEvents.length === 0 ? (
          <div
            style={{
              color: '#999',
              fontSize: '0.875rem',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '1rem',
            }}
          >
            {filterMode === 'chat' ? 'No chat messages yet' : 'No events yet'}
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const isChat = event.type === 'chat'
            const player = playersMap.get(event.playerId)
            const playerColor = getPlayerColor(event.playerId)

            return (
              <div
                key={index}
                style={{
                  opacity: isChat ? 1 : 0.6,
                  fontSize: '0.875rem',
                  lineHeight: 1.4,
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: '#999',
                      flexShrink: 0,
                    }}
                  >
                    {formatTimestamp(event.timestamp)}
                  </span>
                  {isChat ? (
                    <>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: playerColor,
                          flexShrink: 0,
                        }}
                      >
                        {player?.name || 'Unknown'}:
                      </span>
                      <span style={{ color: '#333' }}>{formatEvent(event)}</span>
                    </>
                  ) : (
                    <span style={{ color: '#666' }}>{formatEvent(event)}</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Chat input */}
      <form
        onSubmit={handleSendMessage}
        style={{
          borderTop: '2px solid #e0e0e0',
          padding: '0.75rem',
          display: 'flex',
          gap: '0.5rem',
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '0.5rem',
            fontSize: '0.875rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#2196F3'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#ddd'
          }}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            backgroundColor: message.trim() ? '#2196F3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: message.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
