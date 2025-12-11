import { useMemo } from 'react'

// ElevenLabs API key from environment variable
const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || ''

export function useApiKey() {
  // Log warning once on first use
  useMemo(() => {
    if (!API_KEY) {
      console.warn('VITE_ELEVENLABS_API_KEY not set. Create a .env file with your API key.')
    }
  }, [])

  return {
    apiKey: API_KEY,
    isLoaded: true,
    hasApiKey: !!API_KEY,
  }
}
