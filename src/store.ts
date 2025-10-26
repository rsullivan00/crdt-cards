import * as Y from 'yjs'

// Initialize the YJS document
export const ydoc = new Y.Doc()

// Example: Create a shared map for cards
// This can be used later to store card data
export const cardsMap = ydoc.getMap('cards')

// Log when the document is initialized
console.log('YJS document initialized:', ydoc.guid)
