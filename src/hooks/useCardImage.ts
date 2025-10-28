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
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadImage() {
      setLoading(true)
      setError(false)

      // Check cache first
      const cache = loadCache()
      const cached = cache[cardName]

      if (cached && isCacheValid(cached)) {
        // Use cached image
        if (mounted) {
          setImageUrl(cached.imageUrl)
          setLoading(false)
        }
        return
      }

      // Fetch from Scryfall
      const url = await fetchCardImage(cardName)

      if (mounted) {
        if (url) {
          setImageUrl(url)
          setError(false)

          // Update cache
          cache[cardName] = {
            imageUrl: url,
            scryfallId: '', // Could extract from URL if needed
            cachedAt: Date.now(),
          }
          saveCache(cache)
        } else {
          setImageUrl(null)
          setError(true)
        }
        setLoading(false)
      }
    }

    loadImage()

    return () => {
      mounted = false
    }
  }, [cardName])

  return { imageUrl, loading, error }
}
