import { useState, useCallback, useEffect } from 'react'
import type { Place, PlacesData } from '../types/kakao'

interface UsePlaceSearchResult {
  allPlaces: Place[]
  filteredPlaces: Place[]
  meta: { lastUpdated: string; totalBlogs: number } | null
  isLoading: boolean
  error: string | null
  filter: (region: string) => void
}

export function usePlaceSearch(): UsePlaceSearchResult {
  const [allPlaces, setAllPlaces] = useState<Place[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([])
  const [meta, setMeta] = useState<{ lastUpdated: string; totalBlogs: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/data/places.json')
        if (!res.ok) throw new Error('데이터를 불러올 수 없습니다.')
        const data: PlacesData = await res.json()
        setAllPlaces(data.places)
        setFilteredPlaces(data.places)
        setMeta({
          lastUpdated: data.lastUpdated,
          totalBlogs: data.totalBlogsScraped,
        })
      } catch {
        setError('가게 데이터를 불러올 수 없습니다. 스크래핑을 먼저 실행하세요.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filter = useCallback(
    (region: string) => {
      if (!region.trim()) {
        setFilteredPlaces(allPlaces)
        return
      }
      const keyword = region.trim().toLowerCase()
      setFilteredPlaces(
        allPlaces.filter(
          (p) =>
            p.address_name.toLowerCase().includes(keyword) ||
            p.road_address_name.toLowerCase().includes(keyword) ||
            p.place_name.toLowerCase().includes(keyword)
        )
      )
    },
    [allPlaces]
  )

  return { allPlaces, filteredPlaces, meta, isLoading, error, filter }
}
