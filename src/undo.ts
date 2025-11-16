/**
 * Local undo stack for reverting player actions
 * NOT synced via CRDT - each player has their own undo history
 */

interface UndoAction {
  revert: () => void
  description: string // For debugging/UI feedback
}

const MAX_UNDO_STACK_SIZE = 20

// Undo stack per player (local only)
const undoStacks = new Map<string, UndoAction[]>()

/**
 * Add an action to the undo stack for a player
 */
export function pushUndoAction(playerId: string, action: UndoAction): void {
  let stack = undoStacks.get(playerId)
  if (!stack) {
    stack = []
    undoStacks.set(playerId, stack)
  }

  stack.push(action)

  // Limit stack size to prevent memory issues
  if (stack.length > MAX_UNDO_STACK_SIZE) {
    stack.shift() // Remove oldest
  }
}

/**
 * Undo the last action for a player
 * Returns true if an action was undone, false if stack was empty
 */
export function performUndo(playerId: string): boolean {
  const stack = undoStacks.get(playerId)
  if (!stack || stack.length === 0) {
    return false
  }

  const action = stack.pop()
  if (action) {
    action.revert()
    return true
  }

  return false
}

/**
 * Clear the undo stack for a player (e.g., when leaving game)
 */
export function clearUndoStack(playerId: string): void {
  undoStacks.delete(playerId)
}

/**
 * Check if player has any actions to undo
 */
export function canUndo(playerId: string): boolean {
  const stack = undoStacks.get(playerId)
  return stack !== undefined && stack.length > 0
}

/**
 * Get the number of actions in the undo stack
 */
export function getUndoStackSize(playerId: string): number {
  const stack = undoStacks.get(playerId)
  return stack?.length ?? 0
}

// ============================================================================
// GENERIC UNDO DECORATORS
// ============================================================================

/**
 * Generic wrapper that adds undo support to any function with state capture
 *
 * @param execute - The function to execute
 * @param captureState - Function that captures the current state before execution
 * @param restore - Function that restores the captured state
 * @param getDescription - Function that generates a description for the undo action
 * @param playerIdExtractor - Function that extracts the playerId from the arguments
 *
 * @example
 * const setCardTapped = withAutoUndo(
 *   (cardId, tapped, playerId) => { ... execute logic ... },
 *   (cardId) => cardsMap.get(cardId)?.tapped ?? false,
 *   (prevTapped, cardId, _, playerId) => { ... restore logic ... },
 *   (cardId, tapped) => `${tapped ? 'tap' : 'untap'} card`,
 *   (args) => args[2]
 * )
 */
export function withAutoUndo<TArgs extends any[], TState>(
  execute: (...args: TArgs) => void,
  captureState: (...args: TArgs) => TState,
  restore: (state: TState, ...args: TArgs) => void,
  getDescription: (...args: TArgs) => string,
  playerIdExtractor: (args: TArgs) => string
): (...args: TArgs) => void {
  return (...args: TArgs) => {
    const playerId = playerIdExtractor(args)

    // Capture current state BEFORE executing
    const previousState = captureState(...args)

    // Push undo action
    pushUndoAction(playerId, {
      revert: () => restore(previousState, ...args),
      description: getDescription(...args),
    })

    // Execute the actual operation
    execute(...args)
  }
}

/**
 * Simpler wrapper for operations where the revert operation is explicitly defined
 *
 * @param execute - The function to execute
 * @param createRevert - Function that creates the revert operation based on arguments
 * @param getDescription - Function that generates a description for the undo action
 * @param playerIdExtractor - Function that extracts the playerId from the arguments
 *
 * @example
 * const modifyLifeTotal = withUndo(
 *   (playerId, delta, actionPlayerId) => { ... execute logic ... },
 *   (playerId, delta, actionPlayerId) => () => modifyLifeTotalRaw(playerId, -delta, actionPlayerId),
 *   (playerId, delta) => `life change ${delta > 0 ? '+' : ''}${delta}`,
 *   (args) => args[2]
 * )
 */
export function withUndo<TArgs extends any[]>(
  execute: (...args: TArgs) => void,
  createRevert: (...args: TArgs) => () => void,
  getDescription: (...args: TArgs) => string,
  playerIdExtractor: (args: TArgs) => string
): (...args: TArgs) => void {
  return (...args: TArgs) => {
    const playerId = playerIdExtractor(args)

    // Create and push undo action BEFORE executing
    pushUndoAction(playerId, {
      revert: createRevert(...args),
      description: getDescription(...args),
    })

    // Execute the actual operation
    execute(...args)
  }
}
