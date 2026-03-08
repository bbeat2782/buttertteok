import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'

config({ path: resolve(process.cwd(), '.env.local') })

const CLIENT_ID = process.env.NAVER_CLIENT_ID!
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET!
const DAYS = 7
const MIN_MENTIONS = 2

interface BlogItem {
  title: string
  link: string
  description: string
  postdate: string
  bloggername: string
}

interface PlaceData {
  id: string
  name: string
  address: string
  roadAddress: string
  x: string
  y: string
  category: string
  phone: string
  url: string
}

// 디저트/카페/베이커리가 아닌 카테고리 블랙리스트
const BLOCKED_CATEGORIES = [
  '귀금속', '시계', '주얼리', '액세서리',
  '칼국수', '만두', '순대', '순댓국', '국밥', '설렁탕',
  '맥주', '호프', '술집', '바', '이자카야', '포차',
  '고기', '육류', '삼겹살', '갈비', '곱창', '막창',
  '중식', '일식', '횟집', '초밥', '라멘',
  '치킨', '피자', '햄버거', '패스트푸드',
  '백화점', '마트', '편의점', '슈퍼',
  '만화방', '만화카페', 'PC방',
  '미용', '네일', '헤어',
  '병원', '약국', '의원',
  '부동산', '학원', '세탁',
  '숙박', '모텔', '호텔',
  '자동차', '주유소', '세차',
]

function isBlockedCategory(category: string): boolean {
  const lower = category.toLowerCase()
  return BLOCKED_CATEGORIES.some((blocked) => lower.includes(blocked))
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function getDateNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

// ─── Step 1: Fetch blog posts ───────────────────────────────

async function fetchBlogs(): Promise<BlogItem[]> {
  const cutoff = getDateNDaysAgo(DAYS)
  const all: BlogItem[] = []

  for (let start = 1; start <= 1000; start += 100) {
    console.log(`  Blog API: start=${start}`)
    const params = new URLSearchParams({
      query: '버터떡',
      display: '100',
      start: String(start),
      sort: 'date',
    })

    const res = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?${params}`,
      {
        headers: {
          'X-Naver-Client-Id': CLIENT_ID,
          'X-Naver-Client-Secret': CLIENT_SECRET,
        },
      }
    )

    if (!res.ok) {
      console.log(`  API error: ${res.status}`)
      break
    }

    const data = await res.json()
    const items: BlogItem[] = data.items || []
    if (items.length === 0) break

    for (const item of items) {
      if (item.postdate >= cutoff) {
        all.push(item)
      }
    }

    // 가장 오래된 포스트가 cutoff보다 이전이면 중단
    if (items[items.length - 1].postdate < cutoff) break
    await sleep(200)
  }

  return all
}

// ─── Step 2: Extract place IDs from blog page ───────────────

async function extractPlaceIds(blogUrl: string): Promise<string[]> {
  try {
    // 블로그 URL → PostView URL (서버 렌더링 콘텐츠)
    let fetchUrl = blogUrl
    const blogMatch = blogUrl.match(/blog\.naver\.com\/([^/?]+)\/(\d+)/)
    if (blogMatch) {
      fetchUrl = `https://blog.naver.com/PostView.naver?blogId=${blogMatch[1]}&logNo=${blogMatch[2]}&directAccess=false`
    }

    const res = await fetch(fetchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    })

    if (!res.ok) return []
    const html = await res.text()

    const ids = new Set<string>()

    // 패턴 1: map.naver.com place URLs
    const p1 =
      /map\.naver\.com\/(?:v5|p)\/(?:entry\/place|search\/[^"'\s]+\/place)\/(\d+)/g
    let m
    while ((m = p1.exec(html)) !== null) ids.add(m[1])

    // 패턴 2: place.naver.com URLs
    const p2 =
      /(?:m\.)?place\.naver\.com\/(?:restaurant|cafe|place|bakery|food)\/(\d+)/g
    while ((m = p2.exec(html)) !== null) ids.add(m[1])

    // 패턴 3: data attributes에 포함된 placeId
    const p3 = /"placeId"\s*:\s*"?(\d{5,})"?/g
    while ((m = p3.exec(html)) !== null) ids.add(m[1])

    // 패턴 4: naver.me 단축 URL → 리다이렉트 추적
    const p4 = /https?:\/\/naver\.me\/([A-Za-z0-9_-]+)/g
    const shortUrls: string[] = []
    while ((m = p4.exec(html)) !== null) shortUrls.push(m[0])

    for (const shortUrl of shortUrls.slice(0, 3)) {
      try {
        const r = await fetch(shortUrl, { redirect: 'manual' })
        const loc = r.headers.get('location') || ''
        const pm =
          loc.match(
            /place\.naver\.com\/(?:restaurant|cafe|place|bakery|food)\/(\d+)/
          ) ||
          loc.match(
            /map\.naver\.com\/(?:v5|p)\/(?:entry\/place|search\/[^"'\s]+\/place)\/(\d+)/
          )
        if (pm) ids.add(pm[1])
      } catch {
        /* ignore */
      }
    }

    return Array.from(ids)
  } catch {
    return []
  }
}

// ─── Step 3: Fetch place details from Naver Place page ──────

async function fetchPlaceDetail(
  placeId: string
): Promise<PlaceData | null> {
  const types = ['restaurant', 'cafe', 'place']

  for (const type of types) {
    try {
      const url = `https://m.place.naver.com/${type}/${placeId}/home`
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        },
        redirect: 'follow',
      })

      if (!res.ok) continue
      const html = await res.text()

      // __NEXT_DATA__에서 추출 시도
      const nextMatch = html.match(
        /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
      )
      if (nextMatch) {
        try {
          const nd = JSON.parse(nextMatch[1])
          const state =
            nd?.props?.initialState ?? nd?.props?.pageProps?.initialState
          const p =
            state?.place?.detailPlace ??
            state?.place ??
            state?.detailPlace
          if (p?.name) {
            const pCat = Array.isArray(p.category)
              ? p.category.join(' > ')
              : p.category || ''
            if (isBlockedCategory(pCat)) return null
            const px = String(p.x || p.lng || '0')
            const py = String(p.y || p.lat || '0')
            if (px !== '0' && py !== '0') {
              return {
                id: placeId,
                name: p.name,
                address: p.address || p.addressNew || '',
                roadAddress: p.roadAddress || p.address || '',
                x: px,
                y: py,
                category: pCat,
                phone: p.phone || p.tel || '',
                url: `https://m.place.naver.com/${type}/${placeId}/home`,
              }
            }
          }
        } catch {
          /* parse error */
        }
      }

      // 폴백: HTML에서 직접 추출
      let x = '0',
        y = '0'
      const coordMatch =
        html.match(/"x"\s*:\s*"?([\d.]+)"?\s*,\s*"y"\s*:\s*"?([\d.]+)"?/) ||
        html.match(/"lng"\s*:\s*"?([\d.]+)"?\s*,\s*"lat"\s*:\s*"?([\d.]+)"?/)
      if (coordMatch) {
        x = coordMatch[1]
        y = coordMatch[2]
      }

      if (x === '0' || y === '0') continue

      // 가게 이름: 첫 번째 "name" 필드
      const nameMatch = html.match(/"name"\s*:\s*"([^"]+)"/)
      const name = nameMatch ? nameMatch[1] : ''
      if (!name) continue

      // 카테고리 확인 후 블랙리스트 필터링
      const catMatch = html.match(/"category"\s*:\s*"([^"]+)"/)
      const category = catMatch?.[1] || ''
      if (isBlockedCategory(category)) return null

      // 주소
      const addrMatch = html.match(/"address"\s*:\s*"([^"]+)"/)
      const roadMatch = html.match(/"roadAddress"\s*:\s*"([^"]+)"/)
      const phoneMatch = html.match(/"phone"\s*:\s*"([^"]+)"/)

      return {
        id: placeId,
        name,
        address: addrMatch?.[1] || '',
        roadAddress: roadMatch?.[1] || addrMatch?.[1] || '',
        x,
        y,
        category,
        phone: phoneMatch?.[1] || '',
        url: `https://m.place.naver.com/${type}/${placeId}/home`,
      }
    } catch {
      continue
    }
  }

  return null
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  console.log('=== 버터떡 블로그 스크래핑 ===\n')

  // 1. 블로그 검색
  console.log(`[1/4] 최근 ${DAYS}일간 블로그 검색...`)
  const blogs = await fetchBlogs()
  console.log(`      ${blogs.length}개 포스트 발견\n`)

  if (blogs.length === 0) {
    console.log('블로그 포스트가 없습니다.')
    return
  }

  // 2. 가게 추출
  console.log('[2/4] 블로그에서 네이버 플레이스 링크 추출...')
  const placeMap = new Map<string, string[]>()

  for (let i = 0; i < blogs.length; i++) {
    const blog = blogs[i]
    const pct = Math.round(((i + 1) / blogs.length) * 100)
    process.stdout.write(
      `\r      [${pct}%] ${i + 1}/${blogs.length} 처리 중...`
    )

    const ids = await extractPlaceIds(blog.link)
    for (const id of ids) {
      const urls = placeMap.get(id) || []
      urls.push(blog.link)
      placeMap.set(id, urls)
    }

    await sleep(300)
  }

  console.log(`\n      ${placeMap.size}개의 고유 가게 발견\n`)

  // 3. 필터링
  console.log(`[3/4] ${MIN_MENTIONS}회 이상 언급된 가게 필터...`)
  const filtered = Array.from(placeMap.entries())
    .filter(([, urls]) => urls.length >= MIN_MENTIONS)
    .sort((a, b) => b[1].length - a[1].length)

  console.log(`      ${filtered.length}개 가게 통과\n`)

  if (filtered.length === 0) {
    console.log('조건을 충족하는 가게가 없습니다.')
    // 빈 결과 저장
    saveResults([], blogs.length)
    return
  }

  // 4. 상세정보 조회
  console.log('[4/4] 가게 상세정보 조회...')
  const places: (PlaceData & { mention_count: number })[] = []

  for (const [placeId, blogUrls] of filtered) {
    process.stdout.write(`      ${placeId} (${blogUrls.length}회) → `)
    const detail = await fetchPlaceDetail(placeId)

    if (detail && detail.x !== '0' && detail.y !== '0') {
      places.push({ ...detail, mention_count: blogUrls.length })
      console.log(detail.name)
    } else {
      console.log('좌표 없음, 건너뜀')
    }

    await sleep(500)
  }

  saveResults(places, blogs.length)
}

function saveResults(
  places: (PlaceData & { mention_count: number })[],
  totalBlogs: number
) {
  const outDir = resolve(process.cwd(), 'public/data')
  mkdirSync(outDir, { recursive: true })

  const output = {
    lastUpdated: new Date().toISOString(),
    config: { days: DAYS, minMentions: MIN_MENTIONS },
    totalBlogsScraped: totalBlogs,
    places: places.map((p) => ({
      id: p.id,
      place_name: p.name,
      category_name: p.category,
      phone: p.phone,
      address_name: p.address,
      road_address_name: p.roadAddress,
      x: p.x,
      y: p.y,
      place_url: p.url,
      mention_count: p.mention_count,
    })),
  }

  const outPath = resolve(outDir, 'places.json')
  writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`\n=== 완료 ===`)
  console.log(`블로그 ${totalBlogs}개 → 가게 ${places.length}개`)
  console.log(`저장: ${outPath}`)
}

main().catch(console.error)
