/**
 * CSV utilities for archive storage and export
 */

import type { ArchivedTranscript } from '@/store/settings'

// CSV column headers
const CSV_HEADERS = [
  'id',
  'title',
  'text',
  'category',
  'urgencyLevel',
  'noveltyLevel',
  'hasConsent',
  'createdAt',
  'segments',
  'speakers',
] as const

/**
 * Escape a value for CSV (handle quotes, commas, newlines)
 */
function escapeCSV(value: string | number | boolean | undefined | null): string {
  if (value === null || value === undefined) {
    return ''
  }
  
  const str = String(value)
  
  // If the value contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  
  return str
}

/**
 * Parse a CSV line respecting quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else if (char === '"') {
        // End of quoted section
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        // Start of quoted section
        inQuotes = true
      } else if (char === ',') {
        // End of field
        values.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }
  
  // Don't forget the last field
  values.push(current)
  
  return values
}

/**
 * Convert an archived transcript to a CSV row
 */
function transcriptToCSVRow(transcript: ArchivedTranscript): string {
  const values = [
    transcript.id,
    transcript.title,
    transcript.text,
    transcript.category || 'Note',
    transcript.urgencyLevel ?? 0,
    transcript.noveltyLevel ?? 0,
    transcript.hasConsent,
    transcript.createdAt,
    JSON.stringify(transcript.segments || []),
    JSON.stringify(transcript.speakers || []),
  ]
  
  return values.map(escapeCSV).join(',')
}

/**
 * Parse a CSV row back to an archived transcript
 */
function csvRowToTranscript(row: string): ArchivedTranscript | null {
  try {
    const values = parseCSVLine(row)
    
    if (values.length < 8) {
      console.warn('[CSV] Invalid row, not enough columns:', values.length)
      return null
    }
    
    return {
      id: values[0] || crypto.randomUUID(),
      title: values[1] || 'Untitled',
      text: values[2] || '',
      category: values[3] || 'Note',
      urgencyLevel: parseInt(values[4] ?? '0') || 0,
      noveltyLevel: parseInt(values[5] ?? '0') || 0,
      hasConsent: values[6] === 'true',
      createdAt: parseInt(values[7] ?? '0') || Date.now(),
      segments: values[8] ? JSON.parse(values[8]) : [],
      speakers: values[9] ? JSON.parse(values[9]) : [],
    }
  } catch (e) {
    console.error('[CSV] Failed to parse row:', e)
    return null
  }
}

/**
 * Convert an array of transcripts to CSV string
 */
export function transcriptsToCSV(transcripts: ArchivedTranscript[]): string {
  const header = CSV_HEADERS.join(',')
  const rows = transcripts.map(transcriptToCSVRow)
  return [header, ...rows].join('\n')
}

/**
 * Parse a CSV string to an array of transcripts
 */
export function csvToTranscripts(csv: string): ArchivedTranscript[] {
  const lines = csv.split('\n').filter(line => line.trim())
  
  if (lines.length < 2) {
    return []
  }
  
  // Skip header row
  const dataRows = lines.slice(1)
  
  const transcripts: ArchivedTranscript[] = []
  for (const row of dataRows) {
    const transcript = csvRowToTranscript(row)
    if (transcript) {
      transcripts.push(transcript)
    }
  }
  
  return transcripts
}

/**
 * Generate a user-friendly CSV export (simplified columns for reading)
 */
export function transcriptsToExportCSV(transcripts: ArchivedTranscript[]): string {
  const header = ['Date', 'Title', 'Tag', 'Content'].join(',')
  
  const rows = transcripts.map(t => {
    const date = new Date(t.createdAt).toLocaleString()
    return [
      escapeCSV(date),
      escapeCSV(t.title),
      escapeCSV(t.category || 'Note'),
      escapeCSV(t.text),
    ].join(',')
  })
  
  return [header, ...rows].join('\n')
}

/**
 * Check if running in Tauri
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

/**
 * Download a CSV file
 */
export async function downloadCSV(csv: string, filename: string): Promise<void> {
  if (isTauri()) {
    try {
      // Use Tauri's dialog and fs plugins
      const { save } = await import('@tauri-apps/plugin-dialog')
      const { writeTextFile } = await import('@tauri-apps/plugin-fs')
      
      const filePath = await save({
        defaultPath: filename,
        filters: [{ name: 'CSV', extensions: ['csv'] }]
      })
      
      if (filePath) {
        await writeTextFile(filePath, csv)
        console.log('[CSV] Saved to:', filePath)
      }
    } catch (error) {
      console.error('[CSV] Tauri save failed:', error)
      // Fall back to browser method
      downloadCSVBrowser(csv, filename)
    }
  } else {
    downloadCSVBrowser(csv, filename)
  }
}

/**
 * Browser-based CSV download fallback
 */
function downloadCSVBrowser(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

