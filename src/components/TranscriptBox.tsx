import { useRef, useEffect, useState, useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'
import type { TranscriptSegment } from '@/hooks/useScribeTranscription'
import { BrandMicIcon, ProcessingIcon, BrandPauseIcon, BrandPlayIcon } from '@/components/ui/brand-icons'
import { getSpeakerName, getSpeakerColor } from '@/lib/speakerNames'

// Maximum recording time in milliseconds (1 hour)
const MAX_RECORDING_TIME_MS = 60 * 60 * 1000

function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={cn(
      'inline-flex items-center justify-center px-1.5 py-0.5 rounded',
      'bg-muted/80 border border-border/50 text-[10px] font-medium text-muted-foreground',
      'min-w-[18px]',
      className
    )}>
      {children}
    </kbd>
  )
}

interface TranscriptBoxProps {
  transcript: string
  segments: TranscriptSegment[]
  partialTranscript?: string
  isRecording?: boolean
  isPaused?: boolean
  isProcessing?: boolean  // True when analyzing/archiving after recording ends
  recordingStartTime?: number | null
  onMaxTimeReached?: () => void
  onPause?: () => void
  onResume?: () => void
  className?: string
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function TranscriptBox({
  transcript,
  segments,
  partialTranscript = '',
  isRecording = false,
  isPaused = false,
  isProcessing = false,
  recordingStartTime = null,
  onMaxTimeReached,
  onPause,
  onResume,
  className,
}: TranscriptBoxProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  // Track time accumulated before pause
  const pausedTimeRef = useRef(0)
  const lastActiveTimeRef = useRef<number | null>(null)

  // Timer effect - handles pause/resume
  useEffect(() => {
    if (!isRecording || !recordingStartTime) {
      setElapsedTime(0)
      pausedTimeRef.current = 0
      lastActiveTimeRef.current = null
      return
    }

    // If paused, don't run the interval but preserve the elapsed time
    if (isPaused) {
      // Store the current elapsed time when pausing
      if (lastActiveTimeRef.current !== null) {
        pausedTimeRef.current = elapsedTime
      }
      lastActiveTimeRef.current = null
      return
    }

    // Resuming or starting - set the reference time
    if (lastActiveTimeRef.current === null) {
      lastActiveTimeRef.current = Date.now()
    }

    const updateTimer = () => {
      const now = Date.now()
      const activeElapsed = now - (lastActiveTimeRef.current ?? now)
      const totalElapsed = pausedTimeRef.current + activeElapsed
      setElapsedTime(totalElapsed)
      
      // Check if max time reached
      if (totalElapsed >= MAX_RECORDING_TIME_MS && onMaxTimeReached) {
        onMaxTimeReached()
      }
    }

    // Update immediately
    updateTimer()
    
    // Update every second
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [isRecording, isPaused, recordingStartTime, onMaxTimeReached, elapsedTime])

  // Auto-scroll to bottom when transcript changes
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [transcript, partialTranscript])

  const hasContent = transcript || partialTranscript
  const remainingTime = MAX_RECORDING_TIME_MS - elapsedTime
  const isLowTime = remainingTime < 5 * 60 * 1000 // Less than 5 minutes

  // Group text into paragraphs
  // First try sentence-ending punctuation, fallback to word count
  const formatIntoParagraphs = (text: string): string[] => {
    if (!text.trim()) return []
    
    const trimmedText = text.trim()
    
    // Check if text has sentence-ending punctuation
    const hasPunctuation = /[.!?]/.test(trimmedText)
    
    if (hasPunctuation) {
      // Split on sentence endings followed by space, but keep the punctuation
      const sentences = trimmedText.split(/(?<=[.!?])\s+/)
      
      // Group sentences into paragraphs (roughly 4-6 sentences per paragraph)
      const paragraphs: string[] = []
      let currentParagraph: string[] = []
      
      for (const sentence of sentences) {
        currentParagraph.push(sentence)
        
        // Start new paragraph after 5 sentences or if paragraph is long enough
        if (currentParagraph.length >= 5 || currentParagraph.join(' ').length > 500) {
          paragraphs.push(currentParagraph.join(' '))
          currentParagraph = []
        }
      }
      
      // Don't forget remaining sentences
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '))
      }
      
      return paragraphs
    } else {
      // No punctuation - split by word count (roughly 75 words per paragraph)
      const words = trimmedText.split(/\s+/)
      const paragraphs: string[] = []
      
      for (let i = 0; i < words.length; i += 75) {
        const paragraphWords = words.slice(i, i + 75)
        paragraphs.push(paragraphWords.join(' '))
      }
      
      return paragraphs.length > 0 ? paragraphs : [trimmedText]
    }
  }

  // Group segments into paragraphs (every 4-6 sentences based on length)
  const groupedParagraphs = useMemo(() => {
    if (segments.length === 0) return formatIntoParagraphs(transcript)
    
    const paragraphs: string[] = []
    let currentParagraph: string[] = []
    let sentenceCount = 0
    
    for (const segment of segments) {
      currentParagraph.push(segment.text)
      
      // Count sentences in this segment (by sentence-ending punctuation)
      const sentencesInSegment = (segment.text.match(/[.!?]+/g) || []).length
      sentenceCount += Math.max(1, sentencesInSegment)
      
      // Start new paragraph after 4-6 sentences or when paragraph gets long
      const paragraphText = currentParagraph.join(' ')
      const shouldBreak = sentenceCount >= 5 || paragraphText.length > 500
      
      if (shouldBreak && currentParagraph.length > 0) {
        paragraphs.push(paragraphText)
        currentParagraph = []
        sentenceCount = 0
      }
    }
    
    // Don't forget remaining segments
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(' '))
    }
    
    return paragraphs.length > 0 ? paragraphs : formatIntoParagraphs(transcript)
  }, [segments, transcript])
  
  // Check if we have multi-speaker content
  const hasSpeakers = useMemo(() => {
    return segments.some(s => s.speakerId !== null)
  }, [segments])

  return (
    <div
      className={cn(
        'relative flex-1 rounded-xl bg-muted/30 border border-border/50 overflow-hidden flex flex-col min-h-0',
        className
      )}
    >
      {/* Top right buttons - Pause (when recording) and Processing indicator */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {/* Pause/Resume button - only show when recording */}
        {isRecording && (onPause || onResume) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={isPaused ? onResume : onPause}
            className={cn(
              'h-8 px-2 gap-1 transition-all bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background',
              isPaused && 'bg-[#F58633]/20 border-[#F58633]/50'
            )}
            aria-label={isPaused ? "Resume recording" : "Pause recording"}
          >
            {isPaused ? (
              <BrandPlayIcon size={16} />
            ) : (
              <BrandPauseIcon size={16} />
            )}
            <Kbd>P</Kbd>
          </Button>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2DD28D]/10 border border-[#2DD28D]/30">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#2DD28D] border-t-transparent" />
            <span className="text-xs text-[#2DD28D] font-medium">Archiving...</span>
          </div>
        )}
      </div>

      {/* Transcript content */}
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
        <div className="p-4 pt-14 pb-10">
          {hasContent ? (
            <div className="text-sm leading-relaxed">
              {/* Multi-speaker view - show speaker labels */}
              {hasSpeakers ? (
                <div className="space-y-3">
                  {segments.map((segment, index) => {
                    const speakerName = segment.speakerId ? getSpeakerName(segment.speakerId) : null
                    const speakerColor = segment.speakerId ? getSpeakerColor(segment.speakerId) : null
                    
                    return (
                      <div key={index} className="flex gap-2">
                        {speakerName && (
                          <span 
                            className="text-xs font-medium shrink-0 mt-0.5"
                            style={{ color: speakerColor || undefined }}
                          >
                            {speakerName}:
                          </span>
                        )}
                        <p className="whitespace-pre-wrap flex-1">
                          {segment.text}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Single speaker view - format into paragraphs */
                groupedParagraphs.length > 0 && (
                  <div className="space-y-4">
                    {groupedParagraphs.map((paragraph, index) => (
                      <p key={index} className="whitespace-pre-wrap">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )
              )}
              
              {/* Active chunk - being processed */}
              {partialTranscript && (
                <>
                  {/* Visual divider between processed and active chunk */}
                  {(groupedParagraphs.length > 0 || segments.length > 0) && (
                    <div className="flex items-center gap-2 my-4">
                      <div className="flex-1 h-px bg-border/50" />
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 border border-border/30">
                        <ProcessingIcon className="animate-spin text-muted-foreground/70" />
                      </div>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                  )}
                  <div className="rounded-lg bg-muted/20 border border-border/30 p-3">
                    <p className="text-muted-foreground/70 italic">
                      {partialTranscript}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[120px] py-8 gap-3">
              <BrandMicIcon size={36} className="text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground/40">Press R to record</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Timer - only show when recording */}
      {isRecording && recordingStartTime && (
        <div className="absolute bottom-2 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm border border-border/50">
          <Clock className={cn('h-3 w-3', isLowTime ? 'text-[#F58633]' : 'text-muted-foreground')} />
          <span className={cn(
            'text-xs font-mono tabular-nums',
            isLowTime ? 'text-[#F58633]' : 'text-muted-foreground'
          )}>
            {formatTime(remainingTime)}
          </span>
        </div>
      )}
    </div>
  )
}
