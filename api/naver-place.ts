import type { VercelRequest, VercelResponse } from '@vercel/node'

interface NaverItem {
  title: string
  link: string
  category: string
  description: string
  telephone: string
  address: string
  roadAddress: string
  mapx: string
  mapy: string
}

const ALL_REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주',
  '울산', '세종', '강원', '충북', '충남', '전북', '전남',
  '경북', '경남', '제주',
]

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

async function searchNaver(
  query: string,
  clientId: string,
  clientSecret: string
): Promise<NaverItem[]> {
  const params = new URLSearchParams({
    query,
    display: '5',
    sort: 'comment',
  })

  const response = await fetch(
    `https://openapi.naver.com/v1/search/local.json?${params}`,
    {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    }
  )

  if (!response.ok) return []
  const data = await response.json()
  return data.items || []
}

function dedup(items: NaverItem[]): NaverItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = stripHtml(item.title) + '|' + item.address
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const region = (req.query.region as string) || ''

  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Naver API credentials not configured' })
  }

  try {
    let allItems: NaverItem[]

    if (region) {
      allItems = await searchNaver(`버터떡 ${region}`, clientId, clientSecret)
    } else {
      const queries = ALL_REGIONS.map((r) => `버터떡 ${r}`)
      const results = await Promise.all(
        queries.map((q) => searchNaver(q, clientId, clientSecret))
      )
      allItems = results.flat()
    }

    const unique = dedup(allItems)
    const places = unique
      .map((item, i) => {
        const mx = parseInt(item.mapx, 10)
        const my = parseInt(item.mapy, 10)
        if (!mx || !my) return null

        return {
          id: String(i + 1),
          place_name: stripHtml(item.title),
          category_name: item.category || '',
          phone: item.telephone || '',
          address_name: item.address || '',
          road_address_name: item.roadAddress || '',
          x: String(mx / 1e7),
          y: String(my / 1e7),
          place_url: item.link || '',
        }
      })
      .filter(Boolean)

    return res.status(200).json({ total: places.length, places })
  } catch {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
