import { useEffect, useRef, type HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export type LiveWaveformProps = HTMLAttributes<HTMLDivElement> & {
  active?: boolean
  processing?: boolean
  deviceId?: string
  barWidth?: number
  barHeight?: number
  barGap?: number
  barRadius?: number
  barColor?: string
  fadeEdges?: boolean
  fadeWidth?: number
  height?: string | number
  sensitivity?: number
  smoothingTimeConstant?: number
  fftSize?: number
  historySize?: number
  updateRate?: number
  mode?: "scrolling" | "static"
  /** Interpolation factor for smooth bar height transitions (0-1, higher = faster) */
  lerpFactor?: number
  /** Enable subtle glow effect on bars */
  glowEnabled?: boolean
  onError?: (error: Error) => void
  onStreamReady?: (stream: MediaStream) => void
  onStreamEnd?: () => void
}

// Linear interpolation helper
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor
}

// Ease out cubic for smoother deceleration
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export const LiveWaveform = ({
  active = false,
  processing = false,
  deviceId,
  barWidth = 3,
  barGap = 1,
  barRadius = 1.5,
  barColor,
  fadeEdges = true,
  fadeWidth = 24,
  barHeight: baseBarHeight = 4,
  height = 64,
  sensitivity = 1,
  smoothingTimeConstant = 0.8,
  fftSize = 256,
  historySize = 60,
  updateRate = 30,
  mode = "static",
  lerpFactor = 0.15,
  glowEnabled = true,
  onError,
  onStreamReady,
  onStreamEnd,
  className,
  ...props
}: LiveWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<number[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>(0)
  const lastUpdateRef = useRef<number>(0)
  const processingAnimationRef = useRef<number | null>(null)
  const lastActiveDataRef = useRef<number[]>([])
  const transitionProgressRef = useRef(0)
  const staticBarsRef = useRef<number[]>([])
  const needsRedrawRef = useRef(true)
  const gradientCacheRef = useRef<CanvasGradient | null>(null)
  const lastWidthRef = useRef(0)
  const isInitializedRef = useRef(false)
  // Store target values and displayed values separately for smooth interpolation
  const targetBarsRef = useRef<number[]>([])
  const displayedBarsRef = useRef<number[]>([])
  // For smooth scrolling offset
  const scrollOffsetRef = useRef(0)
  // Fade-in opacity for smooth transitions (0-1)
  const fadeOpacityRef = useRef(0)
  // Track previous active state to detect transitions
  const wasActiveRef = useRef(false)
  // Warm-up frame counter to skip initial jittery data
  const warmupFramesRef = useRef(0)
  const WARMUP_FRAMES = 10 // Skip first N frames after init

  const heightStyle = typeof height === "number" ? `${height}px` : height

  // Handle transitions when active changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    if (active && !wasActiveRef.current) {
      // Starting: fade in from 0
      fadeOpacityRef.current = 0
      warmupFramesRef.current = 0
      
      // Clear everything
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width * 2, rect.height * 2)
      
      // Reset all data
      historyRef.current = []
      staticBarsRef.current = []
      lastActiveDataRef.current = []
      targetBarsRef.current = []
      displayedBarsRef.current = []
      scrollOffsetRef.current = 0
      isInitializedRef.current = false
    } else if (!active && wasActiveRef.current) {
      // Stopping: start fade out (handled in animation loop)
      // Keep fadeOpacityRef at current value, it will fade down
    }
    
    wasActiveRef.current = active
    needsRedrawRef.current = true
  }, [active])

  // Handle canvas resizing
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      gradientCacheRef.current = null
      lastWidthRef.current = rect.width
      needsRedrawRef.current = true
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (processing && !active) {
      let time = 0
      transitionProgressRef.current = 0

      const animateProcessing = () => {
        time += 0.03
        transitionProgressRef.current = Math.min(
          1,
          transitionProgressRef.current + 0.02
        )

        const processingData = []
        const barCount = Math.floor(
          (containerRef.current?.getBoundingClientRect().width || 200) /
            (barWidth + barGap)
        )

        if (mode === "static") {
          const halfCount = Math.floor(barCount / 2)

          for (let i = 0; i < barCount; i++) {
            const normalizedPosition = (i - halfCount) / halfCount
            const centerWeight = 1 - Math.abs(normalizedPosition) * 0.4

            const wave1 = Math.sin(time * 1.5 + normalizedPosition * 3) * 0.25
            const wave2 = Math.sin(time * 0.8 - normalizedPosition * 2) * 0.2
            const wave3 = Math.cos(time * 2 + normalizedPosition) * 0.15
            const combinedWave = wave1 + wave2 + wave3
            const processingValue = (0.2 + combinedWave) * centerWeight

            let finalValue = processingValue
            if (
              lastActiveDataRef.current.length > 0 &&
              transitionProgressRef.current < 1
            ) {
              const lastDataIndex = Math.min(
                i,
                lastActiveDataRef.current.length - 1
              )
              const lastValue = lastActiveDataRef.current[lastDataIndex] || 0
              finalValue =
                lastValue * (1 - transitionProgressRef.current) +
                processingValue * transitionProgressRef.current
            }

            processingData.push(Math.max(0.05, Math.min(1, finalValue)))
          }
        } else {
          for (let i = 0; i < barCount; i++) {
            const normalizedPosition = (i - barCount / 2) / (barCount / 2)
            const centerWeight = 1 - Math.abs(normalizedPosition) * 0.4

            const wave1 = Math.sin(time * 1.5 + i * 0.15) * 0.25
            const wave2 = Math.sin(time * 0.8 - i * 0.1) * 0.2
            const wave3 = Math.cos(time * 2 + i * 0.05) * 0.15
            const combinedWave = wave1 + wave2 + wave3
            const processingValue = (0.2 + combinedWave) * centerWeight

            let finalValue = processingValue
            if (
              lastActiveDataRef.current.length > 0 &&
              transitionProgressRef.current < 1
            ) {
              const lastDataIndex = Math.floor(
                (i / barCount) * lastActiveDataRef.current.length
              )
              const lastValue = lastActiveDataRef.current[lastDataIndex] || 0
              finalValue =
                lastValue * (1 - transitionProgressRef.current) +
                processingValue * transitionProgressRef.current
            }

            processingData.push(Math.max(0.05, Math.min(1, finalValue)))
          }
        }

        if (mode === "static") {
          staticBarsRef.current = processingData
        } else {
          historyRef.current = processingData
        }

        needsRedrawRef.current = true
        processingAnimationRef.current =
          requestAnimationFrame(animateProcessing)
      }

      animateProcessing()

      return () => {
        if (processingAnimationRef.current) {
          cancelAnimationFrame(processingAnimationRef.current)
        }
      }
    } else if (!active && !processing) {
      const hasData =
        mode === "static"
          ? staticBarsRef.current.length > 0
          : historyRef.current.length > 0

      if (hasData) {
        let fadeProgress = 0
        const fadeToIdle = () => {
          fadeProgress += 0.03
          if (fadeProgress < 1) {
            if (mode === "static") {
              staticBarsRef.current = staticBarsRef.current.map(
                (value) => value * (1 - fadeProgress)
              )
            } else {
              historyRef.current = historyRef.current.map(
                (value) => value * (1 - fadeProgress)
              )
            }
            needsRedrawRef.current = true
            requestAnimationFrame(fadeToIdle)
          } else {
            if (mode === "static") {
              staticBarsRef.current = []
            } else {
              historyRef.current = []
            }
          }
        }
        fadeToIdle()
      }
    }
  }, [processing, active, barWidth, barGap, mode])

  // Handle microphone setup and teardown
  useEffect(() => {
    if (!active) {
      isInitializedRef.current = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        onStreamEnd?.()
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = 0
      }
      return
    }

    // Clear all data immediately when starting
    historyRef.current = []
    staticBarsRef.current = []
    lastActiveDataRef.current = []
    isInitializedRef.current = false

    const setupMicrophone = async () => {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices) {
        onError?.(new Error('navigator.mediaDevices is not available'))
        return
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId
            ? {
                deviceId: { exact: deviceId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
        })
        streamRef.current = stream
        onStreamReady?.(stream)

        const AudioContextConstructor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        const audioContext = new AudioContextConstructor()
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = fftSize
        analyser.smoothingTimeConstant = smoothingTimeConstant

        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        audioContextRef.current = audioContext
        analyserRef.current = analyser

        // Mark as initialized - now we can start drawing
        isInitializedRef.current = true
      } catch (error) {
        onError?.(error as Error)
      }
    }

    setupMicrophone()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        onStreamEnd?.()
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = 0
      }
    }
  }, [
    active,
    deviceId,
    fftSize,
    smoothingTimeConstant,
    onError,
    onStreamReady,
    onStreamEnd,
  ])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let rafId: number
    let lastFrameTime = 0

    const animate = (currentTime: number) => {
      // Calculate delta time for frame-independent animation
      const deltaTime = lastFrameTime ? (currentTime - lastFrameTime) / 16.67 : 1
      lastFrameTime = currentTime

      // Render waveform
      const rect = canvas.getBoundingClientRect()

      // Handle fade transitions
      if (active && isInitializedRef.current) {
        // Fade in when active
        fadeOpacityRef.current = Math.min(1, fadeOpacityRef.current + 0.08 * deltaTime)
        // Count warmup frames
        warmupFramesRef.current++
      } else if (!active && fadeOpacityRef.current > 0) {
        // Fade out when inactive
        fadeOpacityRef.current = Math.max(0, fadeOpacityRef.current - 0.1 * deltaTime)
        needsRedrawRef.current = true
      }

      // Update audio data if active, initialized, and past warmup period
      const isPastWarmup = warmupFramesRef.current > WARMUP_FRAMES
      if (active && isInitializedRef.current && isPastWarmup && currentTime - lastUpdateRef.current > updateRate) {
        lastUpdateRef.current = currentTime

        if (analyserRef.current) {
          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount
          )
          analyserRef.current.getByteFrequencyData(dataArray)

          if (mode === "static") {
            // For static mode, update bars in place
            const startFreq = Math.floor(dataArray.length * 0.05)
            const endFreq = Math.floor(dataArray.length * 0.4)
            const relevantData = dataArray.slice(startFreq, endFreq)

            const barCount = Math.floor(rect.width / (barWidth + barGap))
            const halfCount = Math.floor(barCount / 2)
            const newBars: number[] = []

            // Mirror the data for symmetric display
            for (let i = halfCount - 1; i >= 0; i--) {
              const dataIndex = Math.floor(
                (i / halfCount) * relevantData.length
              )
              const value = Math.min(
                1,
                ((relevantData[dataIndex] ?? 0) / 255) * sensitivity
              )
              newBars.push(Math.max(0.05, value))
            }

            for (let i = 0; i < halfCount; i++) {
              const dataIndex = Math.floor(
                (i / halfCount) * relevantData.length
              )
              const value = Math.min(
                1,
                ((relevantData[dataIndex] ?? 0) / 255) * sensitivity
              )
              newBars.push(Math.max(0.05, value))
            }

            // Store as target values for interpolation
            targetBarsRef.current = newBars
            staticBarsRef.current = newBars
            lastActiveDataRef.current = newBars
          } else {
            // Scrolling mode - original behavior
            let sum = 0
            const startFreq = Math.floor(dataArray.length * 0.05)
            const endFreq = Math.floor(dataArray.length * 0.4)
            const relevantData = dataArray.slice(startFreq, endFreq)

            for (let i = 0; i < relevantData.length; i++) {
              sum += relevantData[i] ?? 0
            }
            const average = (sum / relevantData.length / 255) * sensitivity

            // Add to history
            historyRef.current.push(Math.min(1, Math.max(0.05, average)))
            lastActiveDataRef.current = [...historyRef.current]

            // Maintain history size
            if (historyRef.current.length > historySize) {
              historyRef.current.shift()
            }
          }
          needsRedrawRef.current = true
        }
      }

      // Interpolate displayed values toward target values for smooth animation
      if (mode === "static" && targetBarsRef.current.length > 0) {
        const adjustedLerp = Math.min(1, lerpFactor * deltaTime)
        
        // Initialize displayed bars if needed
        if (displayedBarsRef.current.length !== targetBarsRef.current.length) {
          displayedBarsRef.current = [...targetBarsRef.current]
        } else {
          // Smoothly interpolate each bar
          for (let i = 0; i < targetBarsRef.current.length; i++) {
            const target = targetBarsRef.current[i] ?? 0.05
            const current = displayedBarsRef.current[i] ?? 0.05
            displayedBarsRef.current[i] = lerp(current, target, adjustedLerp)
          }
        }
        needsRedrawRef.current = true
      }

      // Only redraw if needed (also redraw during fade out)
      const isFading = fadeOpacityRef.current > 0 && fadeOpacityRef.current < 1
      if (!needsRedrawRef.current && !active && !isFading) {
        rafId = requestAnimationFrame(animate)
        return
      }

      needsRedrawRef.current = active || isFading
      ctx.clearRect(0, 0, rect.width, rect.height)

      // Skip rendering if fully faded out
      if (fadeOpacityRef.current <= 0 && !active && !processing) {
        rafId = requestAnimationFrame(animate)
        return
      }

      const computedBarColor =
        barColor ||
        (() => {
          const style = getComputedStyle(canvas)
          // Try to get the computed color value directly
          const color = style.color
          return color || "#000"
        })()

      const step = barWidth + barGap
      const barCount = Math.floor(rect.width / step)
      const centerY = rect.height / 2
      
      // Apply fade opacity to all rendering
      const fadeMultiplier = fadeOpacityRef.current

      // Draw bars based on mode
      if (mode === "static") {
        // Use interpolated displayed values for smooth rendering
        const dataToRender = processing
          ? staticBarsRef.current
          : active && displayedBarsRef.current.length > 0
            ? displayedBarsRef.current
            : staticBarsRef.current.length > 0
              ? staticBarsRef.current
              : []

        for (let i = 0; i < barCount && i < dataToRender.length; i++) {
          const value = dataToRender[i] || 0.1
          const x = i * step
          const barHeight = Math.max(baseBarHeight, value * rect.height * 0.8)
          const y = centerY - barHeight / 2

          // Draw subtle glow for active bars
          if (glowEnabled && active && value > 0.3) {
            const glowIntensity = easeOutCubic(value) * 0.3 * fadeMultiplier
            ctx.save()
            ctx.shadowColor = computedBarColor
            ctx.shadowBlur = 8 * value
            ctx.fillStyle = computedBarColor
            ctx.globalAlpha = glowIntensity
            if (barRadius > 0) {
              ctx.beginPath()
              ctx.roundRect(x, y, barWidth, barHeight, barRadius)
              ctx.fill()
            } else {
              ctx.fillRect(x, y, barWidth, barHeight)
            }
            ctx.restore()
          }

          ctx.fillStyle = computedBarColor
          ctx.globalAlpha = (0.4 + value * 0.6) * fadeMultiplier

          if (barRadius > 0) {
            ctx.beginPath()
            ctx.roundRect(x, y, barWidth, barHeight, barRadius)
            ctx.fill()
          } else {
            ctx.fillRect(x, y, barWidth, barHeight)
          }
        }
      } else {
        // Scrolling mode - with smooth scroll offset
        const scrollStep = step
        
        for (let i = 0; i < barCount && i < historyRef.current.length; i++) {
          const dataIndex = historyRef.current.length - 1 - i
          const value = historyRef.current[dataIndex] || 0.1
          // Smooth scrolling with subpixel positioning
          const x = rect.width - (i + 1) * scrollStep + scrollOffsetRef.current
          const barHeight = Math.max(baseBarHeight, value * rect.height * 0.8)
          const y = centerY - barHeight / 2

          // Skip bars that are off-screen
          if (x < -barWidth || x > rect.width) continue

          // Draw subtle glow for active bars
          if (glowEnabled && active && value > 0.3) {
            const glowIntensity = easeOutCubic(value) * 0.3 * fadeMultiplier
            ctx.save()
            ctx.shadowColor = computedBarColor
            ctx.shadowBlur = 8 * value
            ctx.fillStyle = computedBarColor
            ctx.globalAlpha = glowIntensity
            if (barRadius > 0) {
              ctx.beginPath()
              ctx.roundRect(x, y, barWidth, barHeight, barRadius)
              ctx.fill()
            } else {
              ctx.fillRect(x, y, barWidth, barHeight)
            }
            ctx.restore()
          }

          ctx.fillStyle = computedBarColor
          ctx.globalAlpha = (0.4 + value * 0.6) * fadeMultiplier

          if (barRadius > 0) {
            ctx.beginPath()
            ctx.roundRect(x, y, barWidth, barHeight, barRadius)
            ctx.fill()
          } else {
            ctx.fillRect(x, y, barWidth, barHeight)
          }
        }
      }

      // Apply edge fading
      if (fadeEdges && fadeWidth > 0 && rect.width > 0) {
        // Cache gradient if width hasn't changed
        if (!gradientCacheRef.current || lastWidthRef.current !== rect.width) {
          const gradient = ctx.createLinearGradient(0, 0, rect.width, 0)
          const fadePercent = Math.min(0.3, fadeWidth / rect.width)

          // destination-out: removes destination where source alpha is high
          // We want: fade edges out, keep center solid
          // Left edge: start opaque (1) = remove, fade to transparent (0) = keep
          gradient.addColorStop(0, "rgba(255,255,255,1)")
          gradient.addColorStop(fadePercent, "rgba(255,255,255,0)")
          // Center stays transparent = keep everything
          gradient.addColorStop(1 - fadePercent, "rgba(255,255,255,0)")
          // Right edge: fade from transparent (0) = keep to opaque (1) = remove
          gradient.addColorStop(1, "rgba(255,255,255,1)")

          gradientCacheRef.current = gradient
          lastWidthRef.current = rect.width
        }

        ctx.globalCompositeOperation = "destination-out"
        ctx.fillStyle = gradientCacheRef.current
        ctx.fillRect(0, 0, rect.width, rect.height)
        ctx.globalCompositeOperation = "source-over"
      }

      ctx.globalAlpha = 1

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [
    active,
    processing,
    sensitivity,
    updateRate,
    historySize,
    barWidth,
    baseBarHeight,
    barGap,
    barRadius,
    barColor,
    fadeEdges,
    fadeWidth,
    mode,
    lerpFactor,
    glowEnabled,
  ])

  return (
    <div
      className={cn("relative h-full w-full", className)}
      ref={containerRef}
      style={{ height: heightStyle }}
      aria-label={
        active
          ? "Live audio waveform"
          : processing
            ? "Processing audio"
            : "Audio waveform idle"
      }
      role="img"
      {...props}
    >
      {!active && !processing && (
        <div className="border-muted-foreground/20 absolute top-1/2 right-0 left-0 -translate-y-1/2 border-t-2 border-dotted" />
      )}
      <canvas
        className="block h-full w-full"
        ref={canvasRef}
        aria-hidden="true"
      />
    </div>
  )
}
