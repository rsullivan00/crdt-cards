import { getPlayerCountersArray, BUILTIN_PLAYER_COUNTERS } from './store'

interface PlayerCountersDisplayProps {
  playerId: string
  onClick: () => void
}

export function PlayerCountersDisplay({ playerId, onClick }: PlayerCountersDisplayProps) {
  const counters = getPlayerCountersArray(playerId)

  // Don't render anything if no counters
  if (counters.length === 0) {
    return null
  }

  // Group and format counters
  const poisonCounters = counters.filter(c => c.type === 'poison')
  const commanderDamageCounters = counters.filter(c => c.type === 'commanderDamage')
  const customCounters = counters.filter(c => !c.isBuiltin)

  const badges: Array<{ emoji: string; value: string | number; color: string; warning: boolean }> = []

  // Poison counter
  if (poisonCounters.length > 0) {
    const value = poisonCounters[0].value
    badges.push({
      emoji: BUILTIN_PLAYER_COUNTERS.poison.emoji,
      value,
      color: BUILTIN_PLAYER_COUNTERS.poison.color,
      warning: value >= 8,
    })
  }

  // Commander damage - show highest value or combined format
  if (commanderDamageCounters.length > 0) {
    const values = commanderDamageCounters.map(c => c.value)
    const maxValue = Math.max(...values)

    // Show as combined format like "⚔️ 12/5/0" for multiple opponents
    const valueStr = values.length > 1 ? values.join('/') : maxValue.toString()

    badges.push({
      emoji: BUILTIN_PLAYER_COUNTERS.commanderDamage.emoji,
      value: valueStr,
      color: BUILTIN_PLAYER_COUNTERS.commanderDamage.color,
      warning: maxValue >= 18,
    })
  }

  // Custom counters - show first 2, then "+X more"
  const displayedCustom = customCounters.slice(0, 2)
  const remainingCustom = customCounters.length - displayedCustom.length

  displayedCustom.forEach(counter => {
    badges.push({
      emoji: counter.type.charAt(0).toUpperCase(), // First letter as emoji
      value: counter.value,
      color: '#2196F3',
      warning: false,
    })
  })

  if (remainingCustom > 0) {
    badges.push({
      emoji: '+',
      value: remainingCustom,
      color: '#757575',
      warning: false,
    })
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: '0.25rem',
        flexWrap: 'wrap',
        cursor: 'pointer',
        marginTop: '0.25rem',
      }}
    >
      {badges.map((badge, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.125rem',
            padding: '0.125rem 0.375rem',
            backgroundColor: badge.warning ? badge.color : '#f5f5f5',
            color: badge.warning ? 'white' : '#333',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            border: badge.warning ? `1px solid ${badge.color}` : '1px solid #ddd',
            animation: badge.warning ? 'pulse 2s infinite' : 'none',
          }}
        >
          <span>{badge.emoji}</span>
          <span>{badge.value}</span>
        </div>
      ))}
    </div>
  )
}
