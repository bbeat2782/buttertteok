import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { query } = req.query

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query parameter is required' })
  }

  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Naver API credentials not configured' })
  }

  try {
    const params = new URLSearchParams({
      query,
      display: '20',
      sort: 'sim',
    })

    const response = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?${params}`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      }
    )

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Naver API request failed' })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
