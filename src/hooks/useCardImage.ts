import { useState, useEffect } from 'react'

const CACHE_KEY = 'crdt-cards-image-cache'
const CACHE_EXPIRY_DAYS = 7

interface CachedImage {
  imageUrl: string
  scryfallId: string
  cachedAt: number
}

interface ImageCache {
  [cardName: string]: CachedImage
}

// Module-level in-memory cache for instant access across component mounts/unmounts
const memoryCache = new Map<string, string>()

// Track ongoing fetch requests to avoid duplicate fetches
const ongoingFetches = new Map<string, Promise<string | null>>()

/**
 * Load image cache from localStorage
 */
function loadCache(): ImageCache {
  try {
    const stored = localStorage.getItem(CACHE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (e) {
    console.error('Failed to load image cache:', e)
    return {}
  }
}

/**
 * Save image cache to localStorage
 */
function saveCache(cache: ImageCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (e) {
    console.error('Failed to save image cache:', e)
  }
}

/**
 * Check if cached image is still valid
 */
function isCacheValid(cached: CachedImage): boolean {
  const now = Date.now()
  const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  return now - cached.cachedAt < expiryMs
}

/**
 * Fetch card image URL from Scryfall API
 */
async function fetchCardImage(cardName: string): Promise<string | null> {
  try {
    // Use Scryfall's fuzzy name search (more forgiving)
    const url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`
    const response = await fetch(url)

    if (!response.ok) {
      console.warn(`Card not found on Scryfall: ${cardName}`)
      return null
    }

    const data = await response.json()

    // Check for double-faced cards
    if (data.card_faces && data.card_faces.length > 0) {
      // Use front face image
      return data.card_faces[0].image_uris?.normal || null
    }

    // Single-faced card
    return data.image_uris?.normal || null
  } catch (e) {
    console.error(`Failed to fetch card image for ${cardName}:`, e)
    return null
  }
}

/**
 * Hook to fetch and cache card images from Scryfall
 */
export function useCardImage(cardName: string) {
  // Check memory cache immediately for initial state
  const cachedUrl = memoryCache.get(cardName)
  const [imageUrl, setImageUrl] = useState<string | null>(cachedUrl || null)
  const [loading, setLoading] = useState(!cachedUrl)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Skip if empty card name
    if (!cardName) {
      setImageUrl(null)
      setLoading(false)
      setError(false)
      return
    }

    let mounted = true

    async function loadImage() {
      // Check memory cache first (instant)
      const memoryCached = memoryCache.get(cardName)
      if (memoryCached) {
        if (mounted) {
          setImageUrl(memoryCached)
          setLoading(false)
          setError(false)
        }
        return
      }

      // Check if there's already an ongoing fetch for this card
      const ongoingFetch = ongoingFetches.get(cardName)
      if (ongoingFetch) {
        const url = await ongoingFetch
        if (mounted) {
          setImageUrl(url)
          setLoading(false)
          setError(!url)
        }
        return
      }

      // Start loading
      setLoading(true)
      setError(false)

      // Check localStorage cache
      const cache = loadCache()
      const cached = cache[cardName]

      if (cached && isCacheValid(cached)) {
        // Save to memory cache for instant future access
        memoryCache.set(cardName, cached.imageUrl)
        if (mounted) {
          setImageUrl(cached.imageUrl)
          setLoading(false)
        }
        return
      }

      // Create and track the fetch promise
      const fetchPromise = fetchCardImage(cardName)
      ongoingFetches.set(cardName, fetchPromise)

      try {
        const url = await fetchPromise

        if (mounted) {
          if (url) {
            setImageUrl(url)
            setError(false)

            // Save to both memory and localStorage caches
            memoryCache.set(cardName, url)
            cache[cardName] = {
              imageUrl: url,
              scryfallId: '',
              cachedAt: Date.now(),
            }
            saveCache(cache)
          } else {
            setImageUrl(null)
            setError(true)
          }
          setLoading(false)
        }
      } finally {
        // Clean up ongoing fetch tracking
        ongoingFetches.delete(cardName)
      }
    }

    loadImage()

    return () => {
      mounted = false
    }
  }, [cardName])

  return { imageUrl, loading, error }
}
