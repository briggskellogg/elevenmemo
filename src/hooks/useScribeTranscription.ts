import { useState, useCallback } from 'react'
import { useScribe, type ScribeStatus } from '@elevenlabs/react'
import { fetchToken } from '@/lib/token'

export interface TranscriptSegment {
  text: string
  speakerId: string | null
}

export interface UseScribeTranscriptionOptions {
  apiKey: string
  deviceId?: string
  languageCode?: string
  onError?: (error: Error) => void
}

export interface UseScribeTranscriptionReturn {
  status: ScribeStatus
  isConnected: boolean
  isTranscribing: boolean
  transcript: string
  segments: TranscriptSegment[]
  speakers: Set<string>
  partialTranscript: string
  partialSpeaker: string | null
  error: string | null
  start: () => Promise<void>
  stop: () => void
  pause: () => void
  resume: () => Promise<void>
  clearTranscript: () => void
}

export function useScribeTranscription({
  apiKey,
  deviceId,
  languageCode = 'en',
  onError,
}: UseScribeTranscriptionOptions): UseScribeTranscriptionReturn {
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [speakers, setSpeakers] = useState<Set<string>>(new Set())
  const [partialSpeaker, setPartialSpeaker] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)
  // Track processed texts to prevent duplicates from multiple callbacks
  const [processedTexts] = useState(() => new Set<string>())

  const scribe = useScribe({
    modelId: 'scribe_v2_realtime',
    languageCode,
    includeTimestamps: true,
    // Tuned VAD settings for better noise rejection
    vadThreshold: 0.6, // Higher threshold = less sensitive to quiet sounds
    minSpeechDurationMs: 250, // Require longer speech to trigger
    minSilenceDurationMs: 500, // Require longer silence to end segment
    microphone: {
      deviceId,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    onCommittedTranscriptWithTimestamps: (data) => {
      const text = data.text.trim()
      if (!text) return
      
      // Create a unique key for this segment to prevent duplicates
      // Use text + timestamp from first word if available
      const firstWord = data.words?.[0] as { start?: number } | undefined
      const segmentKey = `${text}-${firstWord?.start || Date.now()}`
      if (processedTexts.has(segmentKey)) return
      processedTexts.add(segmentKey)

      // Extract speaker from words if available
      let speakerId: string | null = null
      if (data.words && data.words.length > 0) {
        // Log word data for debugging diarization
        const wordWithSpeaker = data.words.find(w => w.speaker_id)
        if (wordWithSpeaker) {
          console.log('[Scribe] Speaker found in words:', wordWithSpeaker.speaker_id)
        }
        
        // Find the most common speaker in this segment
        const speakerCounts = new Map<string, number>()
        for (const word of data.words) {
          if (word.speaker_id) {
            speakerCounts.set(word.speaker_id, (speakerCounts.get(word.speaker_id) || 0) + 1)
          }
        }
        if (speakerCounts.size > 0) {
          speakerId = [...speakerCounts.entries()].reduce((a, b) => a[1] > b[1] ? a : b)[0]
          console.log('[Scribe] Assigned speaker:', speakerId, 'to segment:', text.substring(0, 50))
        }
      }

      setSegments(prev => [...prev, { text, speakerId }])
      
      if (speakerId) {
        setSpeakers(prev => new Set([...prev, speakerId]))
      }
    },
    // Don't use onCommittedTranscript - it fires alongside onCommittedTranscriptWithTimestamps
    // causing duplicates. We only use the timestamps version.
    onPartialTranscript: () => {
      // For partial transcripts, we track via scribe.partialTranscript
    },
    onError: (error) => {
      console.error('Scribe error:', error)
      if (onError && error instanceof Error) {
        onError(error)
      }
    },
    onAuthError: (data) => {
      console.error('Auth error:', data.error)
      setTokenError(data.error)
    },
    onQuotaExceededError: (data) => {
      console.error('Quota exceeded:', data.error)
      setTokenError('Quota exceeded. Please check your ElevenLabs plan.')
    },
    onDisconnect: () => {
      console.log('Scribe disconnected')
    },
  })

  // Compute full transcript from segments
  const transcript = segments.map(s => s.text).join(' ')

  const start = useCallback(async () => {
    if (!apiKey) {
      console.error('No API key provided')
      setTokenError('API key is required')
      throw new Error('API key is required')
    }

    setTokenError(null)

    try {
      console.log('Fetching token with API key...')
      const token = await fetchToken(apiKey)
      console.log('Token received:', token.substring(0, 20) + '...')
      console.log('Connecting to scribe...')
      await scribe.connect({ token })
      console.log('Scribe connected, status:', scribe.status)
    } catch (error) {
      console.error('Start transcription error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start transcription'
      setTokenError(errorMessage)
      if (onError && error instanceof Error) {
        onError(error)
      }
      throw error
    }
  }, [apiKey, scribe, onError])

  const stop = useCallback(() => {
    // Commit any partial transcript as a final segment before stopping
    const partial = scribe.partialTranscript?.trim()
    if (partial) {
      const segmentKey = `${partial}-stop-${Date.now()}`
      if (!processedTexts.has(segmentKey)) {
        processedTexts.add(segmentKey)
        setSegments(prev => [...prev, { text: partial, speakerId: null }])
      }
      scribe.clearTranscripts()
    }
    scribe.disconnect()
  }, [scribe, processedTexts])

  // Pause by disconnecting (stops API calls, preserves transcript)
  // Force completion of any partial transcript before pausing
  const pause = useCallback(() => {
    // Commit any partial transcript as a segment before pausing
    const partial = scribe.partialTranscript?.trim()
    if (partial) {
      // Add ellipsis if the partial doesn't end with punctuation
      // This indicates the thought was interrupted and helps formatting
      const needsEllipsis = !/[.!?]$/.test(partial)
      const textToCommit = needsEllipsis ? `${partial}...` : partial
      
      const segmentKey = `${partial}-pause-${Date.now()}`
      if (!processedTexts.has(segmentKey)) {
        processedTexts.add(segmentKey)
        setSegments(prev => [...prev, { text: textToCommit, speakerId: null }])
      }
      // Clear the partial transcript in scribe
      scribe.clearTranscripts()
    }
    scribe.disconnect()
  }, [scribe, processedTexts])

  // Resume by reconnecting
  const resume = useCallback(async () => {
    if (!apiKey) {
      setTokenError('API key is required')
      return
    }

    setTokenError(null)

    try {
      const token = await fetchToken(apiKey)
      await scribe.connect({ token })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resume transcription'
      setTokenError(errorMessage)
      if (onError && error instanceof Error) {
        onError(error)
      }
    }
  }, [apiKey, scribe, onError])

  const clearTranscript = useCallback(() => {
    setSegments([])
    setSpeakers(new Set())
    setPartialSpeaker(null)
    processedTexts.clear()
    scribe.clearTranscripts()
    setTokenError(null)
  }, [scribe, processedTexts])

  // Combine errors
  const combinedError = tokenError || scribe.error

  return {
    status: scribe.status,
    isConnected: scribe.isConnected,
    isTranscribing: scribe.isTranscribing,
    transcript,
    segments,
    speakers,
    partialTranscript: scribe.partialTranscript,
    partialSpeaker,
    error: combinedError,
    start,
    stop,
    pause,
    resume,
    clearTranscript,
  }
}
