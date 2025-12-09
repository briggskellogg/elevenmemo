/**
 * ElevenLabs Branded Icons
 * Based on Icons_Black_Transparent_BG.svg and Icons_White_Transparent_BG.svg
 * Monochrome stroke icons that adapt to light/dark mode via currentColor
 */

import { cn } from '@/lib/utils'

interface BrandIconProps {
  size?: number
  className?: string
}

// Microphone icon - for recording and device selection
export function BrandMicIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <path 
        d="M24 7V28M24 28C20.134 28 17 24.866 17 21V14C17 10.134 20.134 7 24 7C27.866 7 31 10.134 31 14V21C31 24.866 27.866 28 24 28ZM13 21V23C13 29.075 17.925 34 24 34C30.075 34 35 29.075 35 23V21M24 34V40M18 40H30" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Play icon - for resume (circle with filled triangle)
export function BrandPlayIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <path 
        d="M20 31V17C20 16.33 20.74 15.92 21.32 16.26L32.26 22.74C32.8 23.06 32.8 23.94 32.26 24.26L21.32 30.74C20.74 31.08 20 30.67 20 30Z" 
        fill="currentColor"
      />
      <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="3" />
    </svg>
  )
}

// Pause icon - for pause recording
export function BrandPauseIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="3" />
      <rect x="18" y="17" width="3.5" height="14" rx="1" fill="currentColor" />
      <rect x="26.5" y="17" width="3.5" height="14" rx="1" fill="currentColor" />
    </svg>
  )
}

// Archive icon - box with line
export function BrandArchiveIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <path 
        d="M8 12H40V18H8V12Z" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinejoin="round"
      />
      <path 
        d="M10 18V36C10 37.1 10.9 38 12 38H36C37.1 38 38 37.1 38 36V18" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path d="M19 26H29" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// Copy/Clipboard icon
export function BrandCopyIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <rect x="17" y="17" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="3" />
      <path 
        d="M13 31H11C9.9 31 9 30.1 9 29V11C9 9.9 9.9 9 11 9H29C30.1 9 31 9.9 31 11V13" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Trash icon - for delete/clear
export function BrandTrashIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <path d="M10 14H38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path 
        d="M17 14V11C17 9.9 17.9 9 19 9H29C30.1 9 31 9.9 31 11V14" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M13 14V38C13 39.1 13.9 40 15 40H33C34.1 40 35 39.1 35 38V14" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path d="M19 22V32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M29 22V32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// Check icon - for success
export function BrandCheckIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <path 
        d="M10 24L19 33L38 14" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}

// History/Clock icon - for archive history
export function BrandHistoryIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <circle cx="26" cy="26" r="15" stroke="currentColor" strokeWidth="3" />
      <path d="M26 17V26L31 31" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 14L14 11M14 11V17M14 11H8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Search icon
export function BrandSearchIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <circle cx="21" cy="21" r="12" stroke="currentColor" strokeWidth="3" />
      <path d="M30 30L40 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// X/Close icon
export function BrandCloseIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <path d="M12 12L36 36M36 12L12 36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// Languages/Globe icon
export function BrandLanguagesIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="3" />
      <path d="M9 24H39" stroke="currentColor" strokeWidth="3" />
      <ellipse cx="24" cy="24" rx="6" ry="15" stroke="currentColor" strokeWidth="3" />
    </svg>
  )
}

// Sun icon - for light theme
export function BrandSunIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="3" />
      <path d="M24 6V10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 38V42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M6 24H10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 24H42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M11.5 11.5L14.3 14.3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M33.7 33.7L36.5 36.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M11.5 36.5L14.3 33.7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M33.7 14.3L36.5 11.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// Moon icon - for dark theme
export function BrandMoonIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <path 
        d="M38 28C35 30 31 31 27 31C16.5 31 8 22.5 8 12C8 10 8.3 8 9 6C5 10 2 16 2 23C2 34 11 43 22 43C31 43 39 37 42 29C40.5 28.7 39.25 28.3 38 28Z" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Loader/Spinner icon
export function BrandLoaderIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <path d="M24 8V14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 34V40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
      <path d="M12.7 12.7L16.9 16.9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <path d="M31.1 31.1L35.3 35.3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.2" />
      <path d="M8 24H14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M34 24H40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <path d="M12.7 35.3L16.9 31.1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <path d="M31.1 16.9L35.3 12.7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

// Settings/Gear icon
export function BrandSettingsIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="3" />
      <path 
        d="M21 9L21.6 13.4C20.2 14 18.9 14.8 17.8 15.8L13.8 14.6L10.8 19.4L13.8 22.2C13.6 22.8 13.5 23.4 13.5 24C13.5 24.6 13.6 25.2 13.8 25.8L10.8 28.6L13.8 33.4L17.8 32.2C18.9 33.2 20.2 34 21.6 34.6L21 39H27L27.6 34.6C29 34 30.3 33.2 31.4 32.2L35.4 33.4L38.4 28.6L35.4 25.8C35.6 25.2 35.7 24.6 35.7 24C35.7 23.4 35.6 22.8 35.4 22.2L38.4 19.4L35.4 14.6L31.4 15.8C30.3 14.8 29 14 27.6 13.4L27 9H21Z" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Recording icon - for Start Recording button (microphone with waves)
export function BrandRecordIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <circle cx="24" cy="24" r="8" fill="currentColor" />
      <path 
        d="M34 16C36 18.5 37 21 37 24C37 27 36 29.5 34 32" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round"
      />
      <path 
        d="M14 32C12 29.5 11 27 11 24C11 21 12 18.5 14 16" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round"
      />
    </svg>
  )
}

// Stop icon - for Stop Recording
export function BrandStopIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="3" />
      <rect x="17" y="17" width="14" height="14" rx="2" fill="currentColor" />
    </svg>
  )
}

// Empty transcript icon - document/transcript placeholder
export function EmptyTranscriptIcon({ size = 48, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <path 
        d="M14 8H28L36 16V40C36 41.1 35.1 42 34 42H14C12.9 42 12 41.1 12 40V10C12 8.9 12.9 8 14 8Z" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path d="M28 8V16H36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 24H30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 30H30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 36H24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// Empty archive icon - minimalist void/empty state
export function EmptyArchiveIcon({ size = 48, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      {/* Dashed empty box - represents void/nothing */}
      <rect 
        x="10" 
        y="14" 
        width="28" 
        height="24" 
        rx="2" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeDasharray="4 3"
        opacity="0.5"
      />
      {/* Small circle in center - like a droplet placeholder */}
      <circle 
        cx="24" 
        cy="26" 
        r="4" 
        stroke="currentColor" 
        strokeWidth="2"
        opacity="0.4"
      />
    </svg>
  )
}

// Processing icon - spinner/loading for active transcription
export function ProcessingIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <path d="M24 8V14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 34V40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
      <path d="M12.7 12.7L16.9 16.9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      <path d="M31.1 31.1L35.3 35.3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.2" />
      <path d="M8 24H14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M34 24H40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <path d="M12.7 35.3L16.9 31.1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      <path d="M31.1 16.9L35.3 12.7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    </svg>
  )
}

// Download/Export icon - for CSV export
export function BrandDownloadIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <path 
        d="M24 8V30M24 30L32 22M24 30L16 22" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M10 36V38C10 39.1 10.9 40 12 40H36C37.1 40 38 39.1 38 38V36" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Multiple speakers/users icon - for diarization toggle
export function BrandSpeakersIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      {/* First person (left) */}
      <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="2.5" />
      <path 
        d="M6 38C6 31.4 11.4 26 18 26H14C10.7 26 8 28.7 8 32V38H6Z" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Second person (right) */}
      <circle cx="32" cy="16" r="6" stroke="currentColor" strokeWidth="2.5" />
      <path 
        d="M42 38C42 31.4 36.6 26 30 26H34C37.3 26 40 28.7 40 32V38H42Z" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Connection/merge at bottom */}
      <path 
        d="M14 38H34" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round"
      />
    </svg>
  )
}

// Single speaker icon - for single person mode
export function BrandSingleSpeakerIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      <circle cx="24" cy="14" r="7" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path 
        d="M10 40C10 32.3 16.3 26 24 26C31.7 26 38 32.3 38 40" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Computer/System Audio icon - for capturing system sound
export function BrandComputerAudioIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      {/* Monitor/Screen */}
      <rect x="6" y="8" width="36" height="24" rx="2" stroke="currentColor" strokeWidth="2.5" />
      {/* Screen inner area */}
      <rect x="10" y="12" width="28" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      {/* Stand */}
      <path d="M18 32V36H30V32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 40H34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Sound waves on screen */}
      <path d="M20 20C21 19 21 21 22 20C23 19 23 21 24 20C25 19 25 21 26 20C27 19 27 21 28 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ElevenLabs brand icon (stylized "XI" or waveform)
export function BrandElevenLabsIcon({ size = 24, className }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
    >
      {/* Stylized waveform bars representing ElevenLabs */}
      <rect x="8" y="18" width="4" height="12" rx="2" fill="currentColor" />
      <rect x="15" y="12" width="4" height="24" rx="2" fill="currentColor" />
      <rect x="22" y="8" width="4" height="32" rx="2" fill="currentColor" />
      <rect x="29" y="12" width="4" height="24" rx="2" fill="currentColor" />
      <rect x="36" y="18" width="4" height="12" rx="2" fill="currentColor" />
    </svg>
  )
}

export type { BrandIconProps }
