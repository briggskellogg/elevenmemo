import { useState, useEffect } from 'react'

// ElevenLabs API key from environment variable
const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || ''

export function useApiKey() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!API_KEY) {
      console.warn('VITE_ELEVENLABS_API_KEY not set. Create a .env file with your API key.')
    }
    setIsLoaded(true)
  }, [])

  return {
    apiKey: API_KEY,
    isLoaded,
    hasApiKey: !!API_KEY,
    saveApiKey: async () => {},
    clearApiKey: async () => {},
  }
}
