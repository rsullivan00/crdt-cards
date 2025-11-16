interface ZoneSearchBarProps {
  isOpen: boolean
  searchTerm: string
  onSearchChange: (term: string) => void
  onToggle: () => void
  resultCount?: number
  totalCount?: number
}

export function ZoneSearchBar({
  isOpen,
  searchTerm,
  onSearchChange,
  onToggle,
  resultCount,
  totalCount,
}: ZoneSearchBarProps) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
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
        title="Search"
      >
        🔍
      </button>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flex: 1,
        maxWidth: '400px',
      }}
    >
      <input
        type="text"
        placeholder="Search by card name..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onSearchChange('')
            onToggle()
          }
        }}
        autoFocus
        style={{
          flex: 1,
          padding: '0.4rem 0.6rem',
          fontSize: '0.85rem',
          border: '2px solid #ccc',
          borderRadius: '6px',
          boxSizing: 'border-box',
        }}
      />
      {resultCount !== undefined && totalCount !== undefined && searchTerm && (
        <span style={{ fontSize: '0.75rem', color: '#666', whiteSpace: 'nowrap' }}>
          {resultCount} of {totalCount}
        </span>
      )}
      <button
        onClick={() => {
          onSearchChange('')
          onToggle()
        }}
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
        title="Close search"
      >
        ×
      </button>
    </div>
  )
}
