/**
 * Claude API integration for transcript title generation
 */

export interface TranscriptAnalysis {
  title: string
}

const TITLE_PROMPT = `Generate a short, descriptive title (3-7 words) for this voice transcript. Be specific and engaging, not generic.

Examples:
- "Debugging the OAuth Flow" (not "Technical Discussion")
- "Birthday Party Planning for Mom" (not "Event Planning")  
- "That Weird Dream About Flying" (not "Dream Description")
- "Quick Grocery List Reminder" (not "List")

Respond with ONLY the title, no quotes or extra text.

TRANSCRIPT:
`

/**
 * Generate a simple fallback title from transcript
 */
function generateFallbackTitle(text: string): string {
  const words = text.trim().split(/\s+/).slice(0, 5)
  if (words.length === 0) return 'Voice Memo'
  const title = words.join(' ')
  return title.length > 40 ? title.slice(0, 37) + '...' : title
}

/**
 * Generate a title for a transcript using Claude API
 * @param text The transcript text
 * @param apiKey The Anthropic API key
 * @returns Analysis results with title
 */
export async function analyzeTranscript(
  text: string,
  apiKey: string
): Promise<TranscriptAnalysis> {
  const defaultResult: TranscriptAnalysis = {
    title: generateFallbackTitle(text),
  }

  // Skip for very short transcripts
  if (!text || text.trim().length < 20) {
    console.log('[Claude] Transcript too short, skipping')
    return defaultResult
  }

  // Skip if no API key
  if (!apiKey) {
    console.log('[Claude] No API key provided, skipping')
    return defaultResult
  }

  try {
    console.log('[Claude] Generating title...')
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: TITLE_PROMPT + text.slice(0, 1000),
          },
        ],
      }),
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('[Claude] API error:', response.status)
      return defaultResult
    }

    const data = await response.json()
    const title = data.content?.[0]?.text?.trim() || ''
    
    if (title && title.length > 0 && title.length < 100) {
      console.log('[Claude] Generated title:', title)
      return { title }
    }
    
    return defaultResult
  } catch (error) {
    console.error('[Claude] Title generation failed:', error)
    return defaultResult
  }
}
