import { verifyAuth } from './_lib/auth.js'

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { error: authError } = await verifyAuth(req)
    if (authError) {
      return res.status(401).json({ error: authError })
    }

    const { url, text } = req.body || {}
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
        content = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 30000)
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

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
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
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `Extract job posting details from the following text. Scan the ENTIRE page content — salary, equity, and compensation details may appear anywhere on the page (sidebars, footers, banners, separate sections), not just under a "Compensation" heading. Return ONLY a valid JSON object with no extra text, markdown, or code fences. Extract these fields:

- company_name (string)
- job_title (string)
- location (string or null)
- is_remote (boolean)
- salary_min (number or null — convert shorthand like "$140K" to 140000, "$1.2M" to 1200000)
- salary_max (number or null — same conversion rules)
- salary_currency (string or null, e.g. "USD", "EUR")
- salary_type (string: "hourly" or "annual")
- equity (string or null — e.g. "0.2% – 0.8%", stock option/RSU details if mentioned anywhere)
- required_skills (array of strings — ONLY concrete technical skills, tools, frameworks, languages, and platforms that belong in a resume skills section. Examples: "React.js", "TypeScript", "Node.js", "AWS", "Docker", "Figma", "PostgreSQL", "REST APIs", "GraphQL". Never include soft skills, personality traits, degree requirements, or abstract phrases like "Technical curiosity" or "Team collaboration". Stick to things you'd list in a "Skills" or "Technologies" section on a resume.)
- nice_to_have_skills (array of strings — same rules as required_skills: only concrete tools/technologies. Additionally, infer 3-5 relevant skills NOT explicitly listed in the job description that would strengthen an application based on the role and tech stack. For example, if the JD mentions React and Node.js, you might add "Next.js", "Jest", "Tailwind CSS" as inferred nice-to-haves.)
- application_deadline (ISO date string or null)
- date_posted (ISO date string or null — when the job was originally posted)
- job_summary (2-3 sentence summary of the role)

Important: Look for compensation data throughout the entire page, including ranges like "$140K – $220K", "150,000 - 200,000", or "Estimated Base Salary" sections. Convert all salary values to full numbers (no "K" or "M" suffixes). Return null for any field that cannot be found.

Here is the job posting text:

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
  } catch (err: any) {
    console.error('Function error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
