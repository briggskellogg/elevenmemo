import { useEffect, useCallback } from 'react'
import { useSettingsStore, type ArchivedTranscript, type ArchivedSpeaker } from '@/store/settings'
import { transcriptsToCSV, csvToTranscripts, transcriptsToExportCSV, downloadCSV } from '@/lib/csv'
import type { TranscriptSegment } from '@/hooks/useScribeTranscription'

// File paths for CSV storage
const CSV_FILENAME = 'elevenmemo-archive.csv'
const CATEGORIES_FILENAME = 'elevenmemo-categories.json'

// localStorage keys as fallback
const LOCALSTORAGE_CSV_KEY = 'elevenmemo-archive-csv'
const LOCALSTORAGE_CATEGORIES_KEY = 'elevenmemo-categories'

// Check if running in Tauri
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

// Tauri file system helpers
async function getTauriFS() {
  const { writeTextFile, readTextFile, BaseDirectory, exists, mkdir } = await import('@tauri-apps/plugin-fs')
  return { writeTextFile, readTextFile, BaseDirectory, exists, mkdir }
}

async function ensureAppDataDir() {
  const fs = await getTauriFS()
  const dirExists = await fs.exists('', { baseDir: fs.BaseDirectory.AppData })
  if (!dirExists) {
    await fs.mkdir('', { baseDir: fs.BaseDirectory.AppData, recursive: true })
  }
}

// Read CSV from Tauri file system
async function readCSVFromTauri(): Promise<string> {
  try {
    const fs = await getTauriFS()
    await ensureAppDataDir()
    const fileExists = await fs.exists(CSV_FILENAME, { baseDir: fs.BaseDirectory.AppData })
    if (!fileExists) {
      console.log('[Archive] No CSV file found, starting fresh')
      return ''
    }
    const content = await fs.readTextFile(CSV_FILENAME, { baseDir: fs.BaseDirectory.AppData })
    console.log('[Archive] Read CSV from Tauri:', content.split('\n').length - 1, 'rows')
    return content
  } catch (e) {
    console.error('[Archive] Failed to read CSV from Tauri:', e)
    return ''
  }
}

// Write CSV to Tauri file system
async function writeCSVToTauri(csv: string): Promise<void> {
  try {
    const fs = await getTauriFS()
    await ensureAppDataDir()
    await fs.writeTextFile(CSV_FILENAME, csv, { baseDir: fs.BaseDirectory.AppData })
    console.log('[Archive] Wrote CSV to Tauri:', csv.split('\n').length - 1, 'rows')
  } catch (e) {
    console.error('[Archive] Failed to write CSV to Tauri:', e)
    throw e
  }
}

// Read categories from Tauri file system
async function readCategoriesFromTauri(): Promise<string[]> {
  try {
    const fs = await getTauriFS()
    const fileExists = await fs.exists(CATEGORIES_FILENAME, { baseDir: fs.BaseDirectory.AppData })
    if (!fileExists) {
      return []
    }
    const content = await fs.readTextFile(CATEGORIES_FILENAME, { baseDir: fs.BaseDirectory.AppData })
    return JSON.parse(content)
  } catch (e) {
    console.error('[Archive] Failed to read categories from Tauri:', e)
    return []
  }
}

// Write categories to Tauri file system
async function writeCategoriesToTauri(categories: string[]): Promise<void> {
  try {
    const fs = await getTauriFS()
    await ensureAppDataDir()
    await fs.writeTextFile(CATEGORIES_FILENAME, JSON.stringify(categories), { baseDir: fs.BaseDirectory.AppData })
  } catch (e) {
    console.error('[Archive] Failed to write categories to Tauri:', e)
  }
}

// localStorage fallback for development (non-Tauri)
function loadFromLocalStorage(): { csv: string; categories: string[] } {
  try {
    const csv = localStorage.getItem(LOCALSTORAGE_CSV_KEY) || ''
    const categoriesJson = localStorage.getItem(LOCALSTORAGE_CATEGORIES_KEY)
    return {
      csv,
      categories: categoriesJson ? JSON.parse(categoriesJson) : [],
    }
  } catch (e) {
    console.error('[Archive] Failed to load from localStorage:', e)
    return { csv: '', categories: [] }
  }
}

function saveToLocalStorage(csv: string, categories: string[]): void {
  try {
    localStorage.setItem(LOCALSTORAGE_CSV_KEY, csv)
    localStorage.setItem(LOCALSTORAGE_CATEGORIES_KEY, JSON.stringify(categories))
    console.log('[Archive] Saved to localStorage')
  } catch (e) {
    console.error('[Archive] Failed to save to localStorage:', e)
  }
}

export interface ArchiveTranscriptInput {
  title: string
  text: string
  segments: TranscriptSegment[]
  speakers: ArchivedSpeaker[]
  hasConsent: boolean
  // AI-generated analysis
  category?: string
  urgencyLevel?: number
  noveltyLevel?: number
}

export function useArchive() {
  const {
    archivedTranscripts,
    isArchiveLoaded,
    setArchivedTranscripts,
    addArchivedTranscript,
    removeArchivedTranscript,
    updateArchivedTranscript,
    setIsArchiveLoaded,
    customCategories,
    setCustomCategories,
    addCustomCategory: addCustomCategoryToStore,
  } = useSettingsStore()

  // Load archived transcripts from CSV on mount
  useEffect(() => {
    async function loadArchive() {
      try {
        if (isTauri()) {
          console.log('[Archive] Loading from Tauri CSV file...')
          const csv = await readCSVFromTauri()
          
          if (csv) {
            const transcripts = csvToTranscripts(csv)
            if (transcripts.length > 0) {
              // Sort by createdAt descending (newest first)
              transcripts.sort((a, b) => b.createdAt - a.createdAt)
              setArchivedTranscripts(transcripts)
              console.log('[Archive] Loaded', transcripts.length, 'transcripts from CSV')
            }
          }
          
          // Load custom categories
          const categories = await readCategoriesFromTauri()
          if (categories.length > 0) {
            setCustomCategories(categories)
          }
        } else {
          // Fallback to localStorage for development
          console.log('[Archive] Using localStorage fallback (dev mode)')
          const { csv, categories } = loadFromLocalStorage()
          
          if (csv) {
            const transcripts = csvToTranscripts(csv)
            if (transcripts.length > 0) {
              transcripts.sort((a, b) => b.createdAt - a.createdAt)
              setArchivedTranscripts(transcripts)
              console.log('[Archive] Loaded from localStorage:', transcripts.length, 'transcripts')
            }
          }
          
          if (categories.length > 0) {
            setCustomCategories(categories)
          }
        }
      } catch (error) {
        console.error('[Archive] Failed to load archive:', error)
      } finally {
        setIsArchiveLoaded(true)
      }
    }

    if (!isArchiveLoaded) {
      loadArchive()
    }
  }, [isArchiveLoaded, setArchivedTranscripts, setIsArchiveLoaded, setCustomCategories])

  // Save an archived transcript
  const archiveTranscript = useCallback(async (input: ArchiveTranscriptInput) => {
    if (!input.text.trim()) return null

    const transcript: ArchivedTranscript = {
      id: crypto.randomUUID(),
      title: input.title || 'Untitled Recording',
      text: input.text.trim(),
      segments: input.segments,
      speakers: input.speakers,
      hasConsent: input.hasConsent,
      category: input.category,
      urgencyLevel: input.urgencyLevel,
      noveltyLevel: input.noveltyLevel,
      createdAt: Date.now(),
    }

    try {
      // Update in-memory store first
      addArchivedTranscript(transcript)
      
      // Get updated transcript list and persist as CSV
      const updatedTranscripts = [transcript, ...archivedTranscripts]
      const csv = transcriptsToCSV(updatedTranscripts)
      
      if (isTauri()) {
        await writeCSVToTauri(csv)
        console.log('[Archive] Saved to Tauri CSV:', updatedTranscripts.length, 'transcripts')
      } else {
        const { categories } = loadFromLocalStorage()
        saveToLocalStorage(csv, categories)
      }
      return transcript
    } catch (error) {
      console.error('[Archive] Failed to archive transcript:', error)
      throw error
    }
  }, [addArchivedTranscript, archivedTranscripts])

  // Update an archived transcript
  const updateTranscript = useCallback(async (id: string, updates: Partial<ArchivedTranscript>) => {
    try {
      updateArchivedTranscript(id, updates)
      
      const updatedTranscripts = archivedTranscripts.map(t => 
        t.id === id ? { ...t, ...updates } : t
      )
      const csv = transcriptsToCSV(updatedTranscripts)
      
      if (isTauri()) {
        await writeCSVToTauri(csv)
        console.log('[Archive] Updated transcript in Tauri CSV')
      } else {
        const { categories } = loadFromLocalStorage()
        saveToLocalStorage(csv, categories)
      }
    } catch (error) {
      console.error('[Archive] Failed to update transcript:', error)
      throw error
    }
  }, [updateArchivedTranscript, archivedTranscripts])

  // Delete an archived transcript
  const deleteTranscript = useCallback(async (id: string) => {
    try {
      removeArchivedTranscript(id)
      
      const updatedTranscripts = archivedTranscripts.filter(t => t.id !== id)
      const csv = transcriptsToCSV(updatedTranscripts)
      
      if (isTauri()) {
        await writeCSVToTauri(csv)
        console.log('[Archive] Deleted transcript from Tauri CSV')
      } else {
        const { categories } = loadFromLocalStorage()
        saveToLocalStorage(csv, categories)
      }
    } catch (error) {
      console.error('[Archive] Failed to delete transcript:', error)
      throw error
    }
  }, [removeArchivedTranscript, archivedTranscripts])

  // Add a custom category and persist it
  const addCustomCategory = useCallback(async (category: string) => {
    try {
      addCustomCategoryToStore(category)
      
      const updatedCategories = [...customCategories, category]
      
      if (isTauri()) {
        await writeCategoriesToTauri(updatedCategories)
        console.log('[Archive] Added custom category to Tauri:', category)
      } else {
        const { csv } = loadFromLocalStorage()
        saveToLocalStorage(csv, updatedCategories)
      }
    } catch (error) {
      console.error('[Archive] Failed to add custom category:', error)
      throw error
    }
  }, [addCustomCategoryToStore, customCategories])

  // Export all transcripts as a downloadable CSV
  const exportToCSV = useCallback(async () => {
    if (archivedTranscripts.length === 0) {
      console.log('[Archive] No transcripts to export')
      return
    }
    
    const csv = transcriptsToExportCSV(archivedTranscripts)
    const date = new Date().toISOString().split('T')[0]
    const filename = `elevenmemo-export-${date}.csv`
    
    await downloadCSV(csv, filename)
    console.log('[Archive] Exported', archivedTranscripts.length, 'transcripts to', filename)
  }, [archivedTranscripts])

  return {
    archivedTranscripts,
    isLoaded: isArchiveLoaded,
    archiveTranscript,
    updateTranscript,
    deleteTranscript,
    customCategories,
    addCustomCategory,
    exportToCSV,
  }
}
