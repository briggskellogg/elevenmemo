import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { TranscriptSegment } from '@/hooks/useScribeTranscription'

export type Theme = 'light' | 'dark' | 'system'

// Speaker info stored in archives
export interface ArchivedSpeaker {
  id: string
  name: string
  notes: string
}

// Default category tags
export const DEFAULT_CATEGORIES = ['Note', 'Message', 'Rant', 'Idea', 'Meeting', 'Conversation', 'Task'] as const
export type DefaultCategory = typeof DEFAULT_CATEGORIES[number]

export interface ArchivedTranscript {
  id: string
  title: string
  text: string
  segments: TranscriptSegment[]
  speakers: ArchivedSpeaker[]
  hasConsent: boolean
  // AI-generated analysis
  category?: string // e.g., "Note", "Email", "Rant", "Idea", or custom
  urgencyLevel?: number // 0-5: 0=not urgent, 5=extremely urgent
  noveltyLevel?: number // 0-5: 0=routine, 5=groundbreaking
  // Legacy fields (kept for backwards compatibility)
  priority?: string
  priorityReason?: string
  qualityScore?: number
  qualityReason?: string
  noveltyScore?: number
  coherenceScore?: number
  createdAt: number
}

interface SettingsState {
  apiKey: string
  anthropicApiKey: string
  theme: Theme
  isApiKeyLoaded: boolean
  settingsDialogOpen: boolean
  archiveDialogOpen: boolean
  archivedTranscripts: ArchivedTranscript[]
  isArchiveLoaded: boolean
  customCategories: string[] // User-defined categories that persist

  setApiKey: (key: string) => void
  setAnthropicApiKey: (key: string) => void
  setTheme: (theme: Theme) => void
  setIsApiKeyLoaded: (loaded: boolean) => void
  toggleSettingsDialog: () => void
  setSettingsDialogOpen: (open: boolean) => void
  toggleArchiveDialog: () => void
  setArchiveDialogOpen: (open: boolean) => void
  setArchivedTranscripts: (transcripts: ArchivedTranscript[]) => void
  addArchivedTranscript: (transcript: ArchivedTranscript) => void
  removeArchivedTranscript: (id: string) => void
  updateArchivedTranscript: (id: string, updates: Partial<ArchivedTranscript>) => void
  setIsArchiveLoaded: (loaded: boolean) => void
  addCustomCategory: (category: string) => void
  removeCustomCategory: (category: string) => void
  setCustomCategories: (categories: string[]) => void
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    set => ({
      apiKey: '',
      anthropicApiKey: '',
      theme: 'dark',
      isApiKeyLoaded: false,
      settingsDialogOpen: false,
      archiveDialogOpen: false,
      archivedTranscripts: [],
      isArchiveLoaded: false,
      customCategories: [],

      setApiKey: key =>
        set({ apiKey: key }, undefined, 'setApiKey'),

      setAnthropicApiKey: key =>
        set({ anthropicApiKey: key }, undefined, 'setAnthropicApiKey'),

      setTheme: theme =>
        set({ theme }, undefined, 'setTheme'),

      setIsApiKeyLoaded: loaded =>
        set({ isApiKeyLoaded: loaded }, undefined, 'setIsApiKeyLoaded'),

      toggleSettingsDialog: () =>
        set(
          state => ({ settingsDialogOpen: !state.settingsDialogOpen }),
          undefined,
          'toggleSettingsDialog'
        ),

      setSettingsDialogOpen: open =>
        set({ settingsDialogOpen: open }, undefined, 'setSettingsDialogOpen'),

      toggleArchiveDialog: () =>
        set(
          state => ({ archiveDialogOpen: !state.archiveDialogOpen }),
          undefined,
          'toggleArchiveDialog'
        ),

      setArchiveDialogOpen: open =>
        set({ archiveDialogOpen: open }, undefined, 'setArchiveDialogOpen'),

      setArchivedTranscripts: transcripts =>
        set({ archivedTranscripts: transcripts }, undefined, 'setArchivedTranscripts'),

      addArchivedTranscript: transcript =>
        set(
          state => ({ archivedTranscripts: [transcript, ...state.archivedTranscripts] }),
          undefined,
          'addArchivedTranscript'
        ),

      removeArchivedTranscript: id =>
        set(
          state => ({
            archivedTranscripts: state.archivedTranscripts.filter(t => t.id !== id)
          }),
          undefined,
          'removeArchivedTranscript'
        ),

      updateArchivedTranscript: (id, updates) =>
        set(
          state => ({
            archivedTranscripts: state.archivedTranscripts.map(t =>
              t.id === id ? { ...t, ...updates } : t
            )
          }),
          undefined,
          'updateArchivedTranscript'
        ),

      setIsArchiveLoaded: loaded =>
        set({ isArchiveLoaded: loaded }, undefined, 'setIsArchiveLoaded'),

      addCustomCategory: category =>
        set(
          state => ({
            customCategories: state.customCategories.includes(category)
              ? state.customCategories
              : [...state.customCategories, category]
          }),
          undefined,
          'addCustomCategory'
        ),

      removeCustomCategory: category =>
        set(
          state => ({
            customCategories: state.customCategories.filter(c => c !== category)
          }),
          undefined,
          'removeCustomCategory'
        ),

      setCustomCategories: categories =>
        set({ customCategories: categories }, undefined, 'setCustomCategories'),
    }),
    {
      name: 'settings-store',
    }
  )
)
