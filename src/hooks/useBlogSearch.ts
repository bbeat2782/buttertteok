import { useState, useCallback } from 'react'

export interface BlogPost {
  title: string
  description: string
  link: string
  postdate: string
  bloggername: string
}

interface UseBlogSearchResult {
  posts: BlogPost[]
  isLoading: boolean
  error: string | null
  search: (placeName: string) => void
  clear: () => void
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export function useBlogSearch(): UseBlogSearchResult {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (placeName: string) => {
    setIsLoading(true)
    setError(null)
    setPosts([])

    try {
      const query = encodeURIComponent(`버터떡 ${placeName}`)
      const response = await fetch(`/api/naver-blog?query=${query}`)

      if (!response.ok) {
        throw new Error('블로그 검색 실패')
      }

      const data = await response.json()
      const allItems: BlogPost[] = (data.items || []).map((item: BlogPost) => ({
        title: stripHtml(item.title),
        description: stripHtml(item.description),
        link: item.link,
        postdate: item.postdate,
        bloggername: item.bloggername,
      }))

      // 버터떡이 제목이나 본문에 언급된 글만 필터링
      const filtered = allItems.filter(
        (post) => post.title.includes('버터떡') || post.description.includes('버터떡')
      )

      setPosts(filtered.slice(0, 5))
    } catch {
      setError('블로그 리뷰를 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setPosts([])
    setError(null)
  }, [])

  return { posts, isLoading, error, search, clear }
}
