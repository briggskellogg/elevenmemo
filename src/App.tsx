import { useEffect, useState, useCallback } from 'react'
import { Toaster, toast } from 'sonner'
import { WaveformDisplay } from './components/WaveformDisplay'
import { BrandComputerAudioIcon, BrandSingleSpeakerIcon, BrandCopyIcon, BrandCheckIcon } from '@/components/ui/brand-icons'
import { RecordingBar, type ScribeLanguageCode } from './components/RecordingBar'
import { TranscriptBox } from './components/TranscriptBox'
import { ArchiveDialog } from './components/ArchiveDialog'
import { ThemeToggle } from './components/ThemeToggle'
import { useApiKey } from './hooks/useApiKey'
import { useArchive } from './hooks/useArchive'
import { useScribeTranscription } from './hooks/useScribeTranscription'
import { useSettingsStore } from './store/settings'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import llmemoLogoDark from './assets/llmemo-logo-dark.svg'
import llmemoLogoLight from './assets/llmemo-logo-light.svg'
import orbLogo from './assets/orb-logo.png'
import './App.css'

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

// Generate a simple title from the first few words
function generateTitle(text: string): string {
  const words = text.trim().split(/\s+/).slice(0, 5)
  if (words.length === 0) return 'Voice Memo'
  const title = words.join(' ')
  return title.length > 40 ? title.slice(0, 37) + '...' : title
}

function App() {
  const { apiKey, isLoaded } = useApiKey()
  const { archiveTranscript } = useArchive()
  const { setArchiveDialogOpen, theme } = useSettingsStore()
  const [isStarting, setIsStarting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>()
  const [selectedLanguage, setSelectedLanguage] = useState<ScribeLanguageCode>('en')
  
  // Track if current content has been archived (prevent double archiving)
  const [isArchived, setIsArchived] = useState(false)
  
  // Computer audio mode - enables both mic AND system audio
  const [computerAudioEnabled, setComputerAudioEnabled] = useState(false)
  
  // Multiple speakers toggle for diarization (cannot be changed mid-recording)
  
  // Action feedback states
  const [copyTriggered, setCopyTriggered] = useState(false)

  const {
    status,
    isConnected,
    isTranscribing,
    transcript,
    segments,
    partialTranscript,
    start,
    stop,
    pause,
    resume,
    clearTranscript,
  } = useScribeTranscription({
    apiKey,
    deviceId: selectedDeviceId,
    languageCode: selectedLanguage,
    onError: (err) => {
      console.error('Transcription error:', err)
      setIsStarting(false)
    },
  })

  // Apply theme on mount and when it changes
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [theme])

  // Reset archived state when transcript changes
  useEffect(() => {
    if (transcript || partialTranscript) {
      setIsArchived(false)
    }
  }, [transcript, partialTranscript])

  // Check if there's existing content before starting new recording
  const hasExistingContent = !!(transcript || partialTranscript)

  // Include isPaused to keep the recording bar in "recording" state when paused
  const isRecording = isConnected || isTranscribing || isPaused
  const hasContent = !!(transcript || partialTranscript)

  const handleStartRecording = useCallback(async () => {
    // Clear any existing content and start fresh
    if (hasExistingContent) {
      clearTranscript()
      setIsArchived(false)
    }
    
    // Start recording directly
    setIsStarting(true)
    toast.info('Connecting to ElevenLabs...')
    try {
      console.log('Starting recording with API key:', apiKey ? 'present' : 'missing')
      await start()
      setRecordingStartTime(Date.now())
      toast.success('Recording started')
    } catch (error) {
      console.error('Failed to start recording:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed: ${message}`)
    } finally {
      setIsStarting(false)
    }
  }, [hasExistingContent, start, apiKey, clearTranscript])


  const handleStopRecording = useCallback(async () => {
    setIsProcessing(true)
    stop()
    setIsPaused(false)
    setRecordingStartTime(null)
    
    // Get the full transcript text
    const textToArchive = [transcript, partialTranscript].filter(Boolean).join(' ').trim()
    
    if (textToArchive) {
      try {
        await archiveTranscript({
          title: generateTitle(textToArchive),
          text: textToArchive,
          segments,
          speakers: [],
          hasConsent: true,
          category: 'Note',
          urgencyLevel: 0,
          noveltyLevel: 0,
        })
        
        setIsArchived(true)
        toast.success('Archived!')
      } catch (err) {
        console.error('Failed to archive:', err)
        toast.error('Archive failed')
      }
    } else {
      toast.success('Recording ended')
    }
    setIsProcessing(false)
  }, [stop, transcript, partialTranscript, segments, archiveTranscript])

  // Handler for when max recording time is reached
  const handleMaxTimeReached = useCallback(() => {
    stop()
    setIsPaused(false)
    setRecordingStartTime(null)
    toast.warning('Time limit reached - recording stopped automatically', {
      description: 'Maximum recording time is 1 hour per session.',
      duration: 5000,
    })
  }, [stop])

  const handlePauseRecording = useCallback(() => {
    pause()
    setIsPaused(true)
    toast.success('Recording paused')
  }, [pause])

  const handleResumeRecording = useCallback(async () => {
    await resume()
    setIsPaused(false)
    toast.success('Recording resumed')
  }, [resume])

  const handleDiscard = useCallback(() => {
    stop()
    setIsPaused(false)
    setRecordingStartTime(null)
    clearTranscript()
    setIsArchived(false)
    toast.success('Recording discarded')
  }, [stop, clearTranscript])

  const handleArchive = useCallback(async () => {
    const textToArchive = [transcript, partialTranscript].filter(Boolean).join(' ').trim()
    if (!textToArchive) {
      toast.error('Nothing to archive')
      return
    }
    
    if (isArchived) {
      toast.error('Already archived')
      return
    }
    
    try {
      const title = generateTitle(textToArchive)
      await archiveTranscript({
        title,
        text: textToArchive,
        segments,
        speakers: [],
        hasConsent: true,
        category: 'Note',
        urgencyLevel: 0,
        noveltyLevel: 0,
      })
      setIsArchived(true)
      clearTranscript()
      toast.success(`Archived: ${title}`)
    } catch (err) {
      console.error('Failed to archive:', err)
      toast.error('Failed to archive')
    }
  }, [transcript, partialTranscript, segments, isArchived, archiveTranscript, clearTranscript])

  const handleClear = useCallback(() => {
    if (!transcript && !partialTranscript) return
    clearTranscript()
    setIsArchived(false)
    toast.success('Cleared')
  }, [transcript, partialTranscript, clearTranscript])

  const handleCopy = useCallback(async () => {
    const textToCopy = transcript || partialTranscript
    if (!textToCopy) return
    
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopyTriggered(true)
      setTimeout(() => setCopyTriggered(false), 1500)
      toast.success('Copied to clipboard')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy')
    }
  }, [transcript, partialTranscript])

  const handleToggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    useSettingsStore.getState().setTheme(newTheme)
  }, [theme])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Don't trigger shortcuts when archive dialog is open
      const { archiveDialogOpen } = useSettingsStore.getState()
      
      if (e.key === 'Escape') {
        if (archiveDialogOpen) {
          return // Let the dialog handle its own escape
        }
        if (isConnected) {
          e.preventDefault()
          handleDiscard()
        }
        return
      }

      // Don't process other hotkeys when dialogs are open
      if (archiveDialogOpen) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          if (!isConnected) {
            handleStartRecording()
          }
          break
        case 'e':
          e.preventDefault()
          if (isConnected) {
            handleStopRecording()
          }
          break
        case 'c':
          e.preventDefault()
          handleCopy()
          break
        case 'd':
          e.preventDefault()
          handleClear()
          break
        case 'a':
          e.preventDefault()
          handleArchive()
          break
        case 'h':
          e.preventDefault()
          setArchiveDialogOpen(true)
          break
        case 't':
          e.preventDefault()
          handleToggleTheme()
          break
        case 'p':
          e.preventDefault()
          // Use isRecording (which includes isPaused) to allow resume from paused state
          if (isRecording) {
            if (isPaused) {
              handleResumeRecording()
            } else {
              handlePauseRecording()
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isConnected, isRecording, isPaused, handleStartRecording, handleStopRecording, handlePauseRecording, handleResumeRecording, handleCopy, handleClear, handleArchive, handleDiscard, handleToggleTheme, setArchiveDialogOpen])

  // Determine which logos to use based on theme
  const isDark = theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const headerLogo = isDark ? llmemoLogoLight : llmemoLogoDark

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Toast notifications */}
      <Toaster 
        position="bottom-left"
        toastOptions={{
          duration: 2000,
          className: 'text-sm bg-background border border-border shadow-lg',
        }}
        closeButton
      />

      {/* Header with logo and controls */}
      <div 
        className="relative flex items-center justify-center h-14"
        data-tauri-drag-region
      >
        <img 
          src={headerLogo} 
          alt="llMemo" 
          className="h-6 w-auto drop-shadow-sm"
        />
        <div className="absolute right-3 flex items-center gap-1">
          <ArchiveDialog />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex flex-col flex-1 p-4 gap-4 overflow-hidden">
        {/* Recording Bar - above waveform */}
        <RecordingBar
          isRecording={isRecording}
          isLoading={isStarting || status === 'connecting'}
          isProcessing={isProcessing}
          disabled={!isLoaded}
          hasContent={hasContent}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          selectedDeviceId={selectedDeviceId}
          onDeviceChange={setSelectedDeviceId}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
        />

        {/* Waveform */}
        <WaveformDisplay
          isRecording={isRecording}
          isPaused={isPaused}
          isProcessing={status === 'connecting'}
          deviceId={selectedDeviceId}
        />

        {/* Action Bar */}
        {(
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {/* Computer Audio Toggle - fixed width containers to prevent layout shift */}
              <TooltipProvider>
                <div className="flex items-center gap-2">
                  {/* Left icon - fixed 16px */}
                  <div className="w-4 h-4 flex items-center justify-center">
                    <BrandSingleSpeakerIcon 
                      size={16} 
                      className={isRecording ? 'text-muted-foreground/50' : 'text-muted-foreground'} 
                    />
                  </div>
                  <Switch
                    id="computer-audio-toggle"
                    checked={computerAudioEnabled}
                    onCheckedChange={setComputerAudioEnabled}
                    disabled={isRecording}
                    className="data-[state=checked]:bg-[#2DD28D] h-5 w-9 disabled:opacity-50"
                  />
                  {/* Right icon area - tooltip wraps only the computer icon */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-[52px] h-4 flex items-center justify-start cursor-help">
                        {computerAudioEnabled ? (
                          <div className={`flex items-center gap-0.5 ${
                            isRecording ? 'text-muted-foreground/50' : 'text-[#2DD28D]'
                          }`}>
                            <BrandComputerAudioIcon size={16} />
                            <span className="text-[10px]">+</span>
                            <BrandSingleSpeakerIcon size={16} />
                          </div>
                        ) : (
                          <BrandComputerAudioIcon 
                            size={16} 
                            className={isRecording ? 'text-muted-foreground/50' : 'text-muted-foreground'} 
                          />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px] text-center">
                      <p className="text-xs">
                        {computerAudioEnabled 
                          ? "Now select a virtual audio device (e.g., BlackHole, Loopback) from the microphone dropdown above to capture computer audio"
                          : "Capture computer audio by enabling this, then selecting a virtual audio device from the mic dropdown"
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>

            </div>
            
            {/* Copy button - on the right */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!hasContent}
              className={cn(
                'h-8 px-2 gap-1 transition-all',
                copyTriggered && 'bg-[#2DD28D]/20'
              )}
              aria-label="Copy transcript"
            >
              {copyTriggered ? (
                <BrandCheckIcon size={16} />
              ) : (
                <BrandCopyIcon size={16} />
              )}
              <Kbd>C</Kbd>
            </Button>
          </div>
        )}

        {/* Transcript */}
        <TranscriptBox
          transcript={transcript}
          segments={segments}
          partialTranscript={partialTranscript}
          isRecording={isRecording}
          isPaused={isPaused}
          isProcessing={isProcessing}
          recordingStartTime={recordingStartTime}
          onMaxTimeReached={handleMaxTimeReached}
          onPause={handlePauseRecording}
          onResume={handleResumeRecording}
        />
      </main>

      {/* Footer */}
      <footer className="relative flex flex-col items-center justify-center px-4 py-4 border-t border-border/30">
        <div className="text-center leading-snug">
          <p className="text-[10px] text-muted-foreground/70">"An agent can carry out tasks, but the final responsibility should always remain with a human."</p>
          <p className="text-[9px] text-muted-foreground/50 mt-0.5">Policy based on{' '}
            <a
              href="https://linear.app/developers/aig"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-muted-foreground/70 transition-colors"
            >
              Linear's framework
            </a>.
          </p>
        </div>
        <img 
          src={orbLogo} 
          alt="" 
          className="absolute right-3 bottom-2 h-6 w-6 rounded-full drop-shadow-lg hover:scale-110 transition-transform"
        />
      </footer>
    </div>
  )
}

export default App
