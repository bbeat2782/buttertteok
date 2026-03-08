import type { Plugin } from 'vite'
import { config } from 'dotenv'

config({ path: '.env.local' })

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

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

interface PlaceResult {
  id: string
  place_name: string
  category_name: string
  phone: string
  address_name: string
  road_address_name: string
  x: string
  y: string
  place_url: string
}

const ALL_REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주',
  '울산', '세종', '강원', '충북', '충남', '전북', '전남',
  '경북', '경남', '제주',
]

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

  const data = (await response.json()) as { items?: NaverItem[] }
  return data.items || []
}

function itemToPlace(item: NaverItem, id: number): PlaceResult | null {
  const mx = parseInt(item.mapx, 10)
  const my = parseInt(item.mapy, 10)

  if (!mx || !my) return null

  return {
    id: String(id),
    place_name: stripHtml(item.title),
    category_name: item.category || '',
    phone: item.telephone || '',
    address_name: item.address || '',
    road_address_name: item.roadAddress || '',
    x: String(mx / 1e7),
    y: String(my / 1e7),
    place_url: item.link || '',
  }
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

export function naverApiPlugin(): Plugin {
  return {
    name: 'naver-api',
    configureServer(server) {
      server.middlewares.use('/api/naver-place', async (req, res) => {
        const url = new URL(req.url || '/', 'http://localhost')
        const region = url.searchParams.get('region') || ''

        res.setHeader('Content-Type', 'application/json')

        const clientId = process.env.NAVER_CLIENT_ID
        const clientSecret = process.env.NAVER_CLIENT_SECRET

        if (!clientId || !clientSecret) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Naver API credentials not configured' }))
          return
        }

        try {
          let allItems: NaverItem[]

          if (region) {
            // 특정 지역 검색
            allItems = await searchNaver(`버터떡 ${region}`, clientId, clientSecret)
          } else {
            // 전체: 여러 지역 병렬 검색
            const queries = ALL_REGIONS.map((r) => `버터떡 ${r}`)
            const results = await Promise.all(
              queries.map((q) => searchNaver(q, clientId, clientSecret))
            )
            allItems = results.flat()
          }

          const unique = dedup(allItems)
          const places = unique
            .map((item, i) => itemToPlace(item, i + 1))
            .filter(Boolean)

          res.end(JSON.stringify({ total: places.length, places }))
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Internal server error' }))
        }
      })

      server.middlewares.use('/api/naver-blog', async (req, res) => {
        const url = new URL(req.url || '/', 'http://localhost')
        const query = url.searchParams.get('query')

        res.setHeader('Content-Type', 'application/json')

        if (!query) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'query parameter is required' }))
          return
        }

        const clientId = process.env.NAVER_CLIENT_ID
        const clientSecret = process.env.NAVER_CLIENT_SECRET

        if (!clientId || !clientSecret) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Naver API credentials not configured' }))
          return
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
            res.statusCode = response.status
            res.end(JSON.stringify({ error: 'Naver API request failed' }))
            return
          }

          const data = await response.json()
          res.end(JSON.stringify(data))
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Internal server error' }))
        }
      })
    },
  }
}
