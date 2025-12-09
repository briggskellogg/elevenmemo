// Whimsical speaker name generator - zany but professional, cutesy vibes

const ADJECTIVES = [
  'Sparkly',
  'Cosmic',
  'Fuzzy',
  'Wobbly',
  'Snazzy',
  'Zippy',
  'Glittery',
  'Bouncy',
  'Toasty',
  'Squishy',
  'Dapper',
  'Peppy',
  'Mellow',
  'Twinkly',
  'Swooshy',
  'Wiggly',
]

const ANIMALS = [
  'Capybara',
  'Axolotl',
  'Quokka',
  'Narwhal',
  'Pangolin',
  'Tardigrade',
  'Blobfish',
  'Platypus',
  'Wombat',
  'Fennec',
  'Tapir',
  'Okapi',
  'Manatee',
  'Kiwi',
  'Puffin',
  'Chinchilla',
]

// ElevenLabs brand color palette for speakers
export const SPEAKER_COLOR_PALETTE = [
  { bg: 'bg-[#EB524B]/20', text: 'text-[#EB524B]', border: 'border-[#EB524B]/30', hex: '#EB524B' }, // Red
  { bg: 'bg-[#2DD28D]/20', text: 'text-[#2DD28D]', border: 'border-[#2DD28D]/30', hex: '#2DD28D' }, // Green
  { bg: 'bg-[#5D79DF]/20', text: 'text-[#5D79DF]', border: 'border-[#5D79DF]/30', hex: '#5D79DF' }, // Blue
  { bg: 'bg-[#E273D5]/20', text: 'text-[#E273D5]', border: 'border-[#E273D5]/30', hex: '#E273D5' }, // Pink
  { bg: 'bg-[#F58633]/20', text: 'text-[#F58633]', border: 'border-[#F58633]/30', hex: '#F58633' }, // Orange
  { bg: 'bg-[#37C8B5]/20', text: 'text-[#37C8B5]', border: 'border-[#37C8B5]/30', hex: '#37C8B5' }, // Teal
  { bg: 'bg-[#C47DE5]/20', text: 'text-[#C47DE5]', border: 'border-[#C47DE5]/30', hex: '#C47DE5' }, // Purple
  { bg: 'bg-[#EFDE44]/20', text: 'text-[#EFDE44]', border: 'border-[#EFDE44]/30', hex: '#EFDE44' }, // Yellow
  { bg: 'bg-[#4EC7E0]/20', text: 'text-[#4EC7E0]', border: 'border-[#4EC7E0]/30', hex: '#4EC7E0' }, // Cyan
]

// Default palette for fallback
const DEFAULT_PALETTE = { bg: 'bg-[#5D79DF]/20', text: 'text-[#5D79DF]', border: 'border-[#5D79DF]/30', hex: '#5D79DF' }

// Generate a deterministic but whimsical name from a speaker ID
export function generateWhimsicalName(speakerId: string, index: number): string {
  // Use a simple hash of the speakerId to pick adjective and animal
  let hash = 0
  for (let i = 0; i < speakerId.length; i++) {
    hash = ((hash << 5) - hash) + speakerId.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Use both hash and index to ensure variety
  const adjIndex = Math.abs(hash + index) % ADJECTIVES.length
  const animalIndex = Math.abs(hash * 7 + index * 3) % ANIMALS.length
  
  return `${ADJECTIVES[adjIndex]} ${ANIMALS[animalIndex]}`
}

// Get color palette for a speaker based on their index
export function getSpeakerColorPalette(index: number) {
  return SPEAKER_COLOR_PALETTE[index % SPEAKER_COLOR_PALETTE.length] ?? DEFAULT_PALETTE
}

// Export types for use in other components
export interface SpeakerInfo {
  id: string
  name: string
  notes: string
  colorIndex: number
}

// Create initial speaker info from detected speakers
export function createSpeakerInfo(speakerId: string, index: number): SpeakerInfo {
  return {
    id: speakerId,
    name: generateWhimsicalName(speakerId, index),
    notes: '',
    colorIndex: index % SPEAKER_COLOR_PALETTE.length,
  }
}

// Cache for speaker names and colors
const speakerCache = new Map<string, { name: string; color: string; index: number }>()
let speakerCounter = 0

// Get a friendly name for a speaker ID (cached)
export function getSpeakerName(speakerId: string): string {
  if (!speakerCache.has(speakerId)) {
    const index = speakerCounter++
    const name = generateWhimsicalName(speakerId, index)
    const color = SPEAKER_COLOR_PALETTE[index % SPEAKER_COLOR_PALETTE.length]?.hex ?? DEFAULT_PALETTE.hex
    speakerCache.set(speakerId, { name, color, index })
  }
  return speakerCache.get(speakerId)!.name
}

// Get the color for a speaker ID (cached)
export function getSpeakerColor(speakerId: string): string {
  if (!speakerCache.has(speakerId)) {
    getSpeakerName(speakerId) // This will populate the cache
  }
  return speakerCache.get(speakerId)!.color
}

// Reset the speaker cache (call when starting a new recording)
export function resetSpeakerCache(): void {
  speakerCache.clear()
  speakerCounter = 0
}
