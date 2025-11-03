import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Card as CardType, moveCardToZone, setCardTapped, setCardFaceDown, modifyCounters, counterTypesMap, deleteCard, playersMap, getPlayerColor, isCardSelected, toggleCardSelection, clearSelection, observeSelection, unobserveSelection, getSelectedCardIds, ydoc } from './store'
import { NumberInputModal } from './NumberInputModal'
import { TextInputModal } from './TextInputModal'
import { useCardImage } from './hooks/useCardImage'

// Module-level variable to track if any card is being dragged
let isDraggingAnyCard = false

// Callback to update zones when drag state changes
let onDragStateChange: (() => void) | null = null

// Export function to check if dragging
export const getIsDragging = () => isDraggingAnyCard

// Export function to set drag state change callback
export const setDragStateChangeCallback = (callback: (() => void) | null) => {
  onDragStateChange = callback
}

interface CardProps {
  card: CardType;
  cardId: string;
  playerId: string;
  isInteractive?: boolean;
  forceFaceDown?: boolean;
  opponentPosition?: 'top' | 'left' | 'right' | null;
}

export function Card({
  card,
  cardId,
  playerId,
  isInteractive = true,
  forceFaceDown = false,
  opponentPosition = null,
}: CardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false)
  const [showCountersSubmenu, setShowCountersSubmenu] = useState(false)
  const [showPlayerSubmenu, setShowPlayerSubmenu] = useState(false)
  const [moveSubmenuPosition, setMoveSubmenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [countersSubmenuPosition, setCountersSubmenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [playerSubmenuPosition, setPlayerSubmenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [counterModal, setCounterModal] = useState<{
    type: 'set' | 'add'
    counterType?: string
  } | null>(null)
  const [knownCounterTypes, setKnownCounterTypes] = useState<string[]>([])
  const [otherPlayers, setOtherPlayers] = useState<Array<{ id: string; name: string }>>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isSelected, setIsSelected] = useState(false)
  const [menuSelectedCards, setMenuSelectedCards] = useState<Set<string>>(new Set())
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<number>()
  const cardIsFaceDown = forceFaceDown || card.faceDown

  // Determine if this card is in battlefield zone
  const isInBattlefield = card.zoneId.startsWith('battlefield-')

  // Check if card has hardcoded image URL in metadata (for tokens)
  const hardcodedImageUrl = card.metadata?.imageUrl as string | undefined

  // Fetch card image from Scryfall (only if not face down and no hardcoded URL)
  const { imageUrl: scryfallImageUrl, loading: imageLoading } = useCardImage(
    cardIsFaceDown || hardcodedImageUrl ? '' : card.oracleId
  )

  // Use hardcoded URL if available, otherwise use Scryfall URL
  const imageUrl = hardcodedImageUrl || scryfallImageUrl

  // Subscribe to counter types map
  useEffect(() => {
    const updateCounterTypes = () => {
      const types: string[] = []
      counterTypesMap.forEach((_, type) => {
        types.push(type)
      })
      setKnownCounterTypes(types)
    }

    counterTypesMap.observe(updateCounterTypes)
    updateCounterTypes()

    return () => {
      counterTypesMap.unobserve(updateCounterTypes)
    }
  }, [])

  // Subscribe to players map to track other players
  useEffect(() => {
    const updateOtherPlayers = () => {
      const players: Array<{ id: string; name: string }> = []
      playersMap.forEach((player, playerId) => {
        // Exclude the card owner from the list
        if (playerId !== card.owner) {
          players.push({ id: playerId, name: player.name })
        }
      })
      setOtherPlayers(players)
    }

    playersMap.observe(updateOtherPlayers)
    updateOtherPlayers()

    return () => {
      playersMap.unobserve(updateOtherPlayers)
    }
  }, [card.owner])

  // Subscribe to selection changes
  useEffect(() => {
    const updateSelection = () => {
      setIsSelected(isCardSelected(cardId))
    }

    observeSelection(updateSelection)
    updateSelection()

    return () => {
      unobserveSelection(updateSelection)
    }
  }, [cardId])

  const handleAddCounterType = (counterType: string) => {
    // Record this counter type in the room history
    counterTypesMap.set(counterType, true)

    // Use the captured selection state from when menu opened
    const currentlySelected = menuSelectedCards.has(cardId)
    console.log('handleAddCounterType:', {
      cardId,
      counterType,
      currentlySelected,
      menuSelectedCardsSize: menuSelectedCards.size,
      menuSelectedCardIds: Array.from(menuSelectedCards)
    })
    if (currentlySelected && menuSelectedCards.size > 1) {
      console.log('Applying to multiple cards:', Array.from(menuSelectedCards))
      menuSelectedCards.forEach(selectedCardId => {
        modifyCounters(selectedCardId, counterType, 1, playerId)
      })
    } else {
      console.log('Applying to single card:', cardId)
      modifyCounters(cardId, counterType, 1, playerId)
    }
  }

  const cardStyle: React.CSSProperties = {
    width: '120px',
    height: '160px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: cardIsFaceDown ? '#333' : '#fff',
    padding: '0.5rem',
    position: 'relative',
    transition: 'transform 0.3s ease',
    transform: opponentPosition === 'top' 
      ? `scaleX(-1) rotate(180deg) rotate(${card.tapped ? 90 : 0}deg)` 
      : `rotate(${card.tapped ? 90 : 0}deg)`,
    cursor: isInteractive ? 'pointer' : 'default',
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

  const menuStyle: React.CSSProperties = menuPosition
    ? {
        position: 'fixed',
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
        backgroundColor: 'white',
        border: '2px solid #333',
        borderRadius: '6px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        zIndex: 9999,
        minWidth: '150px',
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        border: '2px solid #333',
        borderRadius: '6px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        zIndex: 9999,
        minWidth: '150px',
      }

  const menuItemStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    fontSize: '0.75rem',
    borderBottom: '1px solid #eee',
  }

  const handleTapToggle = (e: React.MouseEvent) => {
    if (!isInteractive) return
    e.stopPropagation()

    // Ctrl+click for selection (works in all zones)
    if (e.ctrlKey || e.metaKey) {
      toggleCardSelection(cardId)
      return
    }

    // Only battlefield cards can be tapped - for other zones, just clear selection
    if (!isInBattlefield) {
      clearSelection()
      return
    }

    // Check if this card is part of a selection
    const currentlySelected = isCardSelected(cardId)
    const selectedCards = getSelectedCardIds()

    if (currentlySelected && selectedCards.size > 1) {
      // Tap/untap all selected cards together
      const newTappedState = !card.tapped
      selectedCards.forEach(selectedCardId => {
        setCardTapped(selectedCardId, newTappedState, playerId)
      })
      // Keep selection active for additional operations
    } else {
      // Normal click - clear selection and tap just this card
      clearSelection()
      setCardTapped(cardId, !card.tapped, playerId)
    }
  }

  const handleMove = (targetZone: string, position?: 'top' | 'bottom', faceDown?: boolean) => {
    const targetZoneId = `${targetZone}-${playerId}`

    // Use the captured selection state from when menu opened
    const currentlySelected = menuSelectedCards.has(cardId)

    // If this card is selected and there are multiple selections, move all of them
    if (currentlySelected && menuSelectedCards.size > 1) {
      menuSelectedCards.forEach(selectedCardId => {
        moveCardToZone(selectedCardId, targetZoneId, position || 'auto', playerId)

        // Set face-down state if specified
        if (faceDown !== undefined) {
          setCardFaceDown(selectedCardId, faceDown, playerId)
        }
      })
      // Don't clear selection - keep cards selected for additional operations
    } else {
      // Move just this card
      moveCardToZone(cardId, targetZoneId, position || 'auto', playerId)

      // Set face-down state if specified
      if (faceDown !== undefined) {
        setCardFaceDown(cardId, faceDown, playerId)
      }
    }

    setShowMenu(false)
    setShowMoveSubmenu(false)
  }

  const handleMoveToPlayer = (targetPlayerId: string) => {
    const targetZoneId = `battlefield-${targetPlayerId}`

    // Use the captured selection state from when menu opened
    const currentlySelected = menuSelectedCards.has(cardId)

    // If this card is selected and there are multiple selections, move all of them
    if (currentlySelected && menuSelectedCards.size > 1) {
      menuSelectedCards.forEach(selectedCardId => {
        moveCardToZone(selectedCardId, targetZoneId, 'auto', playerId)
        // Set card face-up when giving to another player
        setCardFaceDown(selectedCardId, false, playerId)
      })
      // Don't clear selection - keep cards selected for additional operations
    } else {
      // Move just this card
      moveCardToZone(cardId, targetZoneId, 'auto', playerId)
      // Set card face-up when giving to another player
      setCardFaceDown(cardId, false, playerId)
    }

    setShowMenu(false)
    setShowMoveSubmenu(false)
    setShowPlayerSubmenu(false)
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (!isInteractive) {
      e.preventDefault()
      return
    }
    setIsDragging(true)
    isDraggingAnyCard = true
    onDragStateChange?.()

    // Calculate where on the card the user clicked (offset from top-left)
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('cardId', cardId)
    e.dataTransfer.setData('fromZoneId', card.zoneId)
    e.dataTransfer.setData('playerId', playerId)
    e.dataTransfer.setData('order', card.order.toString())
    e.dataTransfer.setData('dragOffsetX', offsetX.toString())
    e.dataTransfer.setData('dragOffsetY', offsetY.toString())

    // If this card is part of a selection, include all selected cards
    const selectedCards = getSelectedCardIds()
    if (isSelected && selectedCards.size > 1) {
      const cardsMap = ydoc.getMap('cards')
      const selectedCardData: { id: string; relativeX: number; relativeY: number }[] = []

      // Check if we're dragging from battlefield (cards have positions)
      if (card.position) {
        // Battlefield: store relative positions to maintain layout
        cardsMap.forEach((cardData, cardIdKey) => {
          const typedCard = cardData as CardType
          if (selectedCards.has(cardIdKey) && typedCard.position) {
            selectedCardData.push({
              id: cardIdKey,
              relativeX: typedCard.position.x - card.position!.x,
              relativeY: typedCard.position.y - card.position!.y,
            })
          }
        })
      } else {
        // Other zones: just include all selected card IDs, will be positioned in a grid
        selectedCards.forEach(selectedCardId => {
          selectedCardData.push({
            id: selectedCardId,
            relativeX: 0,
            relativeY: 0,
          })
        })
      }

      e.dataTransfer.setData('selectedCards', JSON.stringify(selectedCardData))
    }

    // Set custom drag image with the same offset for better visual feedback
    try {
      e.dataTransfer.setDragImage(e.currentTarget, offsetX, offsetY)
    } catch (err) {
      // setDragImage can fail in some browsers, ignore errors
      console.warn('Could not set custom drag image:', err)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    isDraggingAnyCard = false
    onDragStateChange?.()
  }

  const handleMouseEnter = () => {
    // Don't show preview if card is face down, no image, or dragging
    if (cardIsFaceDown || !imageUrl || isDragging) return

    // Set timeout to show preview after 600ms
    hoverTimeoutRef.current = window.setTimeout(() => {
      setShowPreview(true)
    }, 600)
  }

  const handleMouseLeave = () => {
    // Clear timeout if mouse leaves before preview shows
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current)
    }
    setShowPreview(false)
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Calculate preview position
  const getPreviewPosition = (): { top: number; left: number } | null => {
    if (!cardRef.current) return null

    const rect = cardRef.current.getBoundingClientRect()
    const previewWidth = 488
    const previewHeight = 680
    const gap = 16

    // Try to place on right side
    let left = rect.right + gap
    let top = rect.top

    // If too close to right edge, place on left instead
    if (left + previewWidth > window.innerWidth - 8) {
      left = rect.left - previewWidth - gap
    }

    // Keep within viewport vertically
    if (top + previewHeight > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - previewHeight - 8)
    }

    return { top, left }
  }

  // Removed old drag over/drop handlers - will use grid-based drop targets in Zone instead

  // Determine positioning style based on zone and position
  const wrapperStyle: React.CSSProperties = isInBattlefield && card.position
    ? {
        position: 'absolute',
        left: `${card.position.x}px`,
        top: `${card.position.y}px`,
        zIndex: card.order, // Use order as z-index so last-moved cards are on top
      }
    : {
        position: 'relative',
      }

  return (
    <div
      style={wrapperStyle}
      data-card-id={cardId}
      data-order={card.order}
      data-zone-id={card.zoneId}
    >
      <div
        ref={cardRef}
        style={{
          ...cardStyle,
          padding: 0, // Remove padding for image
          overflow: 'hidden',
          opacity: isDragging ? 0.5 : 1,
          cursor: isInteractive ? 'grab' : 'default',
          border: 'none',
          outline: isSelected ? '4px solid #2196F3' : 'none',
          outlineOffset: '-4px',
          boxShadow: isSelected ? '0 0 12px rgba(33, 150, 243, 0.8)' : 'none',
        }}
        title={!cardIsFaceDown || card.owner === playerId ? card.oracleId : undefined}
        draggable={isInteractive}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleTapToggle}
        onContextMenu={(e) => {
          if (!isInteractive) return
          e.preventDefault()
          // Capture selection state when menu opens
          const selectedCards = getSelectedCardIds()
          const currentlySelected = isCardSelected(cardId)
          setMenuSelectedCards(selectedCards)
          console.log('Menu opened - captured selection:', {
            cardId,
            currentlySelected,
            selectedCardsSize: selectedCards.size,
            selectedCardIds: Array.from(selectedCards)
          })
          setShowMenu(!showMenu)
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Card Image or Loading/Error State */}
        {cardIsFaceDown ? (
          // Show card back for face-down cards
          <div style={cardBackStyle}>🂠</div>
        ) : imageLoading ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              color: '#999',
            }}
          >
            Loading...
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={card.oracleId}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '5px',
            }}
          />
        ) : (
          // Fallback: Show text if image fails to load
          <div
            style={{
              width: '100%',
              height: '100%',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 'bold',
                wordBreak: 'break-all',
              }}
            >
              {card.oracleId}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#666' }}>
              No image
            </div>
          </div>
        )}

        {/* Overlays - Individual Counter Badges */}
        {Object.entries(card.counters).length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              alignItems: 'flex-end',
            }}
          >
            {Object.entries(card.counters)
              .slice(0, 3)
              .map(([type, count]) => {
                // Abbreviate counter types for display
                let displayText = count.toString()
                if (type === '+1/+1') displayText = `+${count}`
                else if (type === 'Loyalty') displayText = `L${count}`
                else if (type === '-1/-1') displayText = `-${count}`
                else displayText = count.toString()

                return (
                  <div
                    key={type}
                    style={{
                      backgroundColor: type === 'Loyalty' ? '#9C27B0' : '#FF5722',
                      color: 'white',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      minWidth: '20px',
                      textAlign: 'center',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }}
                    title={`${type}: ${count}`}
                  >
                    {displayText}
                  </div>
                )
              })}
            {Object.entries(card.counters).length > 3 && (
              <div
                style={{
                  backgroundColor: '#757575',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  minWidth: '20px',
                  textAlign: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
                title={`+${Object.entries(card.counters).length - 3} more types`}
              >
                ...
              </div>
            )}
          </div>
        )}

        {card.attachments.length > 0 && (
          <div
            style={attachmentIndicatorStyle}
            title={`${card.attachments.length} attachments`}
          >
            +{card.attachments.length}
          </div>
        )}


        {/* Move button - only show for owner when face down, or everyone when face up */}
        {isInteractive && (!cardIsFaceDown || card.owner === playerId) && (
          <button
            ref={menuButtonRef}
            onClick={(e) => {
              e.stopPropagation()

              // Capture selection state when menu button is clicked
              const selectedCards = getSelectedCardIds()
              const currentlySelected = isCardSelected(cardId)
              setMenuSelectedCards(selectedCards)
              console.log('Menu button clicked - captured selection:', {
                cardId,
                currentlySelected,
                selectedCardsSize: selectedCards.size,
                selectedCardIds: Array.from(selectedCards)
              })

              if (!showMenu && menuButtonRef.current) {
                const rect = menuButtonRef.current.getBoundingClientRect()
                const viewportHeight = window.innerHeight
                const viewportWidth = window.innerWidth

                // Calculate position - place to the right of button
                let left = rect.right + 8
                let top = rect.top

                // If menu would go off right edge, place to the left instead
                const menuWidth = 150
                if (left + menuWidth > viewportWidth) {
                  left = rect.left - menuWidth - 8
                }

                // If menu would go off bottom, adjust upward
                const menuHeight = 150
                if (top + menuHeight > viewportHeight) {
                  top = Math.max(8, viewportHeight - menuHeight - 8)
                }

                setMenuPosition({ top, left })
              }
              setShowMenu(!showMenu)
            }}
            style={{
              position: 'absolute',
              top: '5px',
              left: '5px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.7rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          >
            ⋮
          </button>
        )}
      </div>

      {/* Movement menu - rendered via portal to escape container boundaries */}
      {isInteractive && showMenu && createPortal(
        <>
          {/* Backdrop to close menu */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998,
            }}
            onClick={() => setShowMenu(false)}
          />
          <div style={menuStyle}>
            {/* Move submenu header */}
            <div
              style={{
                ...menuItemStyle,
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'

                // Close counters submenu if open
                setShowCountersSubmenu(false)
                setCountersSubmenuPosition(null)

                const rect = e.currentTarget.getBoundingClientRect()
                const viewportWidth = window.innerWidth
                const viewportHeight = window.innerHeight

                // Try to place submenu to the right
                let left = rect.right + 4
                let top = rect.top

                const submenuWidth = 200
                const submenuHeight = 300

                // If would go off right edge, place to the left instead
                if (left + submenuWidth > viewportWidth) {
                  left = rect.left - submenuWidth - 4
                }

                // Keep within viewport vertically
                if (top + submenuHeight > viewportHeight) {
                  top = Math.max(8, viewportHeight - submenuHeight - 8)
                }

                setMoveSubmenuPosition({ top, left })
                setShowMoveSubmenu(true)
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <span>
                Move to...
                {menuSelectedCards.has(cardId) && menuSelectedCards.size > 1 && (
                  <span style={{
                    marginLeft: '6px',
                    color: '#2196F3',
                    fontWeight: 'bold',
                    fontSize: '0.9em'
                  }}>
                    ({menuSelectedCards.size} cards)
                  </span>
                )}
              </span>
              <span>▶</span>
            </div>

            {/* Counters submenu header */}
            <div
              style={{
                ...menuItemStyle,
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'

                // Close move submenu if open
                setShowMoveSubmenu(false)
                setMoveSubmenuPosition(null)

                const rect = e.currentTarget.getBoundingClientRect()
                const viewportWidth = window.innerWidth
                const viewportHeight = window.innerHeight

                // Try to place submenu to the right
                let left = rect.right + 4
                let top = rect.top

                const submenuWidth = 250
                const submenuHeight = 400

                // If would go off right edge, place to the left instead
                if (left + submenuWidth > viewportWidth) {
                  left = rect.left - submenuWidth - 4
                }

                // Keep within viewport vertically
                if (top + submenuHeight > viewportHeight) {
                  top = Math.max(8, viewportHeight - submenuHeight - 8)
                }

                setCountersSubmenuPosition({ top, left })
                setShowCountersSubmenu(true)
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <span>
                Counters...
                {menuSelectedCards.has(cardId) && menuSelectedCards.size > 1 && (
                  <span style={{
                    marginLeft: '6px',
                    color: '#2196F3',
                    fontWeight: 'bold',
                    fontSize: '0.9em'
                  }}>
                    ({menuSelectedCards.size} cards)
                  </span>
                )}
              </span>
              <span>▶</span>
            </div>

            {/* Turn Face Down/Up Option - Only show for battlefield and exile */}
            {(isInBattlefield || card.zoneId.startsWith('exile-')) && (
              <div
                style={menuItemStyle}
                onClick={(e) => {
                  e.stopPropagation()
                  
                  // Use the captured selection state from when menu opened
                  const currentlySelected = menuSelectedCards.has(cardId)
                  const newFaceDownState = !card.faceDown
                  
                  if (currentlySelected && menuSelectedCards.size > 1) {
                    // Apply to all selected cards
                    menuSelectedCards.forEach(selectedCardId => {
                      setCardFaceDown(selectedCardId, newFaceDownState, playerId)
                    })
                  } else {
                    // Apply to just this card
                    setCardFaceDown(cardId, newFaceDownState, playerId)
                  }
                  
                  setShowMenu(false)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                {card.faceDown ? '👁️ Turn face up' : '🔒 Turn face down'}
                {menuSelectedCards.has(cardId) && menuSelectedCards.size > 1 && (
                  <span style={{
                    marginLeft: '6px',
                    color: '#2196F3',
                    fontWeight: 'bold',
                    fontSize: '0.9em'
                  }}>
                    ({menuSelectedCards.size} cards)
                  </span>
                )}
              </div>
            )}

            {/* Delete Token Option - Only show for tokens */}
            {card.metadata?.isToken && (
              <div
                style={{
                  ...menuItemStyle,
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  fontWeight: 'bold',
                  borderBottom: 'none',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  deleteCard(cardId, playerId)
                  setShowMenu(false)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffcdd2'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffebee'
                }}
              >
                🗑️ Delete Token
              </div>
            )}
          </div>

          {/* Floating submenu for "Counters..." */}
          {showCountersSubmenu && countersSubmenuPosition && (
            <div
              style={{
                position: 'fixed',
                top: `${countersSubmenuPosition.top}px`,
                left: `${countersSubmenuPosition.left}px`,
                backgroundColor: 'white',
                border: '2px solid #333',
                borderRadius: '6px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                zIndex: 10000,
                minWidth: '220px',
                maxHeight: '400px',
                overflowY: 'auto',
              }}
              onMouseEnter={() => setShowCountersSubmenu(true)}
              onMouseLeave={() => {
                setShowCountersSubmenu(false)
                setCountersSubmenuPosition(null)
              }}
            >
              {/* List existing counters */}
              {Object.entries(card.counters).length > 0 && (
                <>
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      color: '#666',
                      backgroundColor: '#f9f9f9',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    EXISTING COUNTERS
                  </div>
                  {Object.entries(card.counters).map(([type, count]) => (
                    <div
                      key={type}
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.75rem',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 'bold' }}>
                        {type}: {count}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const currentlySelected = menuSelectedCards.has(cardId)
                            if (currentlySelected && menuSelectedCards.size > 1) {
                              menuSelectedCards.forEach(selectedCardId => {
                                modifyCounters(selectedCardId, type, 1, playerId)
                              })
                            } else {
                              modifyCounters(cardId, type, 1, playerId)
                            }
                          }}
                          style={{
                            padding: '2px 6px',
                            fontSize: '0.7rem',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                          }}
                        >
                          +1
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const currentlySelected = menuSelectedCards.has(cardId)
                            if (currentlySelected && menuSelectedCards.size > 1) {
                              menuSelectedCards.forEach(selectedCardId => {
                                modifyCounters(selectedCardId, type, -1, playerId)
                              })
                            } else {
                              modifyCounters(cardId, type, -1, playerId)
                            }
                          }}
                          style={{
                            padding: '2px 6px',
                            fontSize: '0.7rem',
                            backgroundColor: '#F44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                          }}
                        >
                          -1
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setCounterModal({ type: 'set', counterType: type })
                            setShowMenu(false)
                            setShowCountersSubmenu(false)
                          }}
                          style={{
                            padding: '2px 6px',
                            fontSize: '0.7rem',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                          }}
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Quick Add Section */}
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  color: '#666',
                  backgroundColor: '#f9f9f9',
                  borderBottom: '1px solid #eee',
                }}
              >
                QUICK ADD
              </div>

              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  borderBottom: Object.entries(card.counters).length > 0 ? 'none' : '1px solid #eee',
                }}
              >
                {/* Always show +1/+1 and Loyalty */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddCounterType('+1/+1')
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  +1/+1
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddCounterType('Loyalty')
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    backgroundColor: '#9C27B0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Loyalty
                </button>

                {/* Show previously used counter types (excluding the presets) */}
                {knownCounterTypes
                  .filter((type) => type !== '+1/+1' && type !== 'Loyalty')
                  .map((type) => (
                    <button
                      key={type}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddCounterType(type)
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      {type}
                    </button>
                  ))}

                {/* Custom button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCounterModal({ type: 'add' })
                    setShowMenu(false)
                    setShowCountersSubmenu(false)
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    backgroundColor: '#757575',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Custom...
                </button>
              </div>
            </div>
          )}

          {/* Floating submenu for "Move to..." */}
          {showMoveSubmenu && moveSubmenuPosition && (
            <div
              style={{
                position: 'fixed',
                top: `${moveSubmenuPosition.top}px`,
                left: `${moveSubmenuPosition.left}px`,
                backgroundColor: 'white',
                border: '2px solid #333',
                borderRadius: '6px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                zIndex: 10000,
                minWidth: '180px',
              }}
              onMouseEnter={() => setShowMoveSubmenu(true)}
              onMouseLeave={() => {
                setShowMoveSubmenu(false)
                setMoveSubmenuPosition(null)
              }}
            >
              <div
                style={menuItemStyle}
                onClick={() => handleMove('hand', undefined, false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Hand
              </div>
              <div
                style={menuItemStyle}
                onClick={() => handleMove('battlefield', undefined, false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Battlefield (face-up)
              </div>
              <div
                style={menuItemStyle}
                onClick={() => handleMove('battlefield', undefined, true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Battlefield (face-down)
              </div>
              <div
                style={menuItemStyle}
                onClick={() => handleMove('graveyard', undefined, false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Graveyard
              </div>
              <div
                style={menuItemStyle}
                onClick={() => handleMove('exile', undefined, false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Exile (face-up)
              </div>
              <div
                style={menuItemStyle}
                onClick={() => handleMove('exile', undefined, true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Exile (face-down)
              </div>
              <div
                style={menuItemStyle}
                onClick={() => handleMove('deck', 'top', false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Deck (top)
              </div>
              <div
                style={menuItemStyle}
                onClick={() => handleMove('deck', 'bottom', false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                → Deck (bottom)
              </div>

              {/* Player submenu option - only show if there are other players */}
              {otherPlayers.length > 0 && (
                <div
                  style={{ ...menuItemStyle, borderBottom: 'none' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'

                    const rect = e.currentTarget.getBoundingClientRect()
                    const viewportWidth = window.innerWidth
                    const viewportHeight = window.innerHeight

                    // Try to place player submenu to the right
                    let left = rect.right + 4
                    let top = rect.top

                    const submenuWidth = 180
                    const submenuHeight = 150

                    // If would go off right edge, place to the left instead
                    if (left + submenuWidth > viewportWidth) {
                      left = rect.left - submenuWidth - 4
                    }

                    // Keep within viewport vertically
                    if (top + submenuHeight > viewportHeight) {
                      top = Math.max(8, viewportHeight - submenuHeight - 8)
                    }

                    setPlayerSubmenuPosition({ top, left })
                    setShowPlayerSubmenu(true)
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>
                      → Player
                      {menuSelectedCards.has(cardId) && menuSelectedCards.size > 1 && (
                        <span style={{
                          marginLeft: '6px',
                          color: '#2196F3',
                          fontWeight: 'bold',
                          fontSize: '0.9em'
                        }}>
                          ({menuSelectedCards.size} cards)
                        </span>
                      )}
                    </span>
                    <span>▶</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Floating submenu for "Player >" */}
          {showPlayerSubmenu && playerSubmenuPosition && otherPlayers.length > 0 && (
            <div
              style={{
                position: 'fixed',
                top: `${playerSubmenuPosition.top}px`,
                left: `${playerSubmenuPosition.left}px`,
                backgroundColor: 'white',
                border: '2px solid #333',
                borderRadius: '6px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                zIndex: 10001,
                minWidth: '160px',
              }}
              onMouseEnter={() => setShowPlayerSubmenu(true)}
              onMouseLeave={() => {
                setShowPlayerSubmenu(false)
                setPlayerSubmenuPosition(null)
              }}
            >
              {otherPlayers.map((player, index) => {
                const playerColor = getPlayerColor(player.id)
                return (
                  <div
                    key={player.id}
                    style={{
                      ...menuItemStyle,
                      borderBottom: index === otherPlayers.length - 1 ? 'none' : '1px solid #eee',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onClick={() => handleMoveToPlayer(player.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white'
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: playerColor,
                        flexShrink: 0,
                      }}
                    />
                    <span>{player.name}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>,
        document.body
      )}

      {/* Counter Modals */}
      {isInteractive && counterModal?.type === 'set' && counterModal.counterType && (
        <NumberInputModal
          title={`Set ${counterModal.counterType} counters`}
          max={99}
          onConfirm={(value) => {
            const currentlySelected = menuSelectedCards.has(cardId)
            if (currentlySelected && menuSelectedCards.size > 1) {
              menuSelectedCards.forEach(selectedCardId => {
                const selectedCard = ydoc.getMap('cards').get(selectedCardId) as CardType
                if (selectedCard) {
                  const current = selectedCard.counters[counterModal.counterType!] || 0
                  modifyCounters(selectedCardId, counterModal.counterType!, value - current, playerId)
                }
              })
            } else {
              const current = card.counters[counterModal.counterType!] || 0
              modifyCounters(cardId, counterModal.counterType!, value - current, playerId)
            }
            setCounterModal(null)
          }}
          onCancel={() => setCounterModal(null)}
        />
      )}

      {isInteractive && counterModal?.type === 'add' && (
        <TextInputModal
          title="Add Counter Type"
          placeholder="e.g., +1/+1, Loyalty, Charge"
          onConfirm={(counterType) => {
            const currentlySelected = menuSelectedCards.has(cardId)
            if (currentlySelected && menuSelectedCards.size > 1) {
              menuSelectedCards.forEach(selectedCardId => {
                modifyCounters(selectedCardId, counterType, 1, playerId)
              })
            } else {
              modifyCounters(cardId, counterType, 1, playerId)
            }
            setCounterModal(null)
          }}
          onCancel={() => setCounterModal(null)}
        />
      )}

      {/* Card Preview - rendered via portal */}
      {showPreview && imageUrl && !cardIsFaceDown && (() => {
        const position = getPreviewPosition()
        if (!position) return null

        const hasCounters = Object.entries(card.counters).length > 0

        return createPortal(
          <div
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: '488px',
              zIndex: 10000,
              pointerEvents: 'none', // Allow mouse to pass through
            }}
          >
            <img
              src={imageUrl}
              alt={card.oracleId}
              style={{
                width: '100%',
                height: '680px',
                borderRadius: '12px',
                border: '4px solid #fff',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                objectFit: 'cover',
              }}
            />
            {/* Counter details overlay on preview */}
            {hasCounters && (
              <div
                style={{
                  marginTop: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '4px solid #fff',
                  borderRadius: '8px',
                  padding: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '8px',
                  }}
                >
                  Counters:
                </div>
                {Object.entries(card.counters).map(([type, count]) => (
                  <div
                    key={type}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      fontSize: '0.85rem',
                      color: '#fff',
                    }}
                  >
                    <span>{type}</span>
                    <span style={{ fontWeight: 'bold' }}>×{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>,
          document.body
        )
      })()}
    </div>
  )
}
