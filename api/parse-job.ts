import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAuth } from './_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { error: authError } = await verifyAuth(req)
  if (authError) {
    return res.status(401).json({ error: authError })
  }

  const { url, text } = req.body as { url?: string; text?: string }

  let content: string

  if (url) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        return res.status(200).json({
          error: 'Failed to fetch the job posting page.',
          fallback: true,
        })
      }

      const html = await response.text()
      // Strip HTML to readable text - remove scripts, styles, and tags
      content = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 30000) // Limit content size for Claude
    } catch {
      return res.status(200).json({
        error: 'Could not fetch the job posting. The site may be blocking automated requests.',
        fallback: true,
      })
    }
  } else if (text) {
    content = text.slice(0, 30000)
  } else {
    return res.status(400).json({ error: 'Provide either a url or text field' })
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Extract job posting details from the following text. Return ONLY a valid JSON object with no extra text, markdown, or code fences. Extract these fields:

- company_name (string)
- job_title (string)
- location (string or null)
- is_remote (boolean)
- salary_min (number or null)
- salary_max (number or null)
- salary_currency (string or null, e.g. "USD", "EUR")
- required_skills (array of strings)
- nice_to_have_skills (array of strings)
- application_deadline (ISO date string or null)
- job_summary (2-3 sentence summary of the role)

Return null for any field that cannot be found. Here is the job posting text:

${content}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', errorText)
      return res.status(200).json({
        error: 'Failed to analyze the job posting.',
        fallback: true,
      })
    }

    const result = await response.json()
    const responseText =
      result.content?.[0]?.type === 'text' ? result.content[0].text : ''

    // Parse the JSON from Claude's response
    // Try to extract JSON even if Claude wrapped it
    let parsed
    try {
      parsed = JSON.parse(responseText)
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        return res.status(200).json({
          error: 'Could not parse the extracted data.',
          fallback: true,
        })
      }
    }

    return res.status(200).json({ data: parsed })
  } catch (err) {
    console.error('Parse error:', err)
    return res.status(200).json({
      error: 'An error occurred while analyzing the job posting.',
      fallback: true,
    })
  }
  } catch (topErr) {
    console.error('Function crash:', topErr)
    return res.status(500).json({ error: String(topErr) })
  }
}
