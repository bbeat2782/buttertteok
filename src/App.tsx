import { useState, useCallback, useMemo } from 'react'
import KakaoMapLoader from './components/KakaoMapLoader'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import MapView from './components/MapView'
import PlaceList from './components/PlaceList'
import BlogReviews from './components/BlogReviews'
import { usePlaceSearch } from './hooks/usePlaceSearch'
import { useBlogSearch } from './hooks/useBlogSearch'
import type { Place } from './types/kakao'
import './App.css'

const DEFAULT_CENTER = { lat: 35.9, lng: 127.8 }
const DEFAULT_LEVEL = 14

function getBounds(places: Place[]): { center: { lat: number; lng: number }; level: number } {
  if (places.length === 0) return { center: DEFAULT_CENTER, level: DEFAULT_LEVEL }
  if (places.length === 1) {
    return { center: { lat: Number(places[0].y), lng: Number(places[0].x) }, level: 5 }
  }

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  for (const p of places) {
    const lat = Number(p.y), lng = Number(p.x)
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
  }

  const center = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }
  const latDiff = maxLat - minLat
  const lngDiff = maxLng - minLng
  const maxDiff = Math.max(latDiff, lngDiff)

  let level = 8
  if (maxDiff > 3) level = 13
  else if (maxDiff > 1.5) level = 11
  else if (maxDiff > 0.5) level = 9
  else if (maxDiff > 0.1) level = 7
  else if (maxDiff > 0.02) level = 5
  else level = 3

  return { center, level }
}

function AppContent() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [level, setLevel] = useState(DEFAULT_LEVEL)
  const { filteredPlaces, meta, isLoading, error, filter } = usePlaceSearch()
  const { posts: blogPosts, isLoading: blogLoading, error: blogError, search: searchBlog, clear: clearBlog } = useBlogSearch()

  const handleSearch = useCallback((region: string) => {
    setSelectedPlace(null)
    clearBlog()
    filter(region)
  }, [filter, clearBlog])

  // 필터 결과가 바뀌면 지도 자동 이동
  useMemo(() => {
    const { center: c, level: l } = getBounds(filteredPlaces)
    setCenter(c)
    setLevel(l)
  }, [filteredPlaces])

  const handleMarkerClick = useCallback((place: Place | null) => {
    if (!place) {
      setSelectedPlace(null)
      clearBlog()
      return
    }
    setSelectedPlace(place)
    setCenter({ lat: Number(place.y), lng: Number(place.x) })
    setLevel(5)
    searchBlog(place.place_name)
  }, [searchBlog, clearBlog])

  const handlePlaceSelect = useCallback((place: Place) => {
    setSelectedPlace(place)
    setCenter({ lat: Number(place.y), lng: Number(place.x) })
    setLevel(3)
    searchBlog(place.place_name)
  }, [searchBlog])

  const handleCenterChanged = useCallback((map: kakao.maps.Map) => {
    const latlng = map.getCenter()
    setCenter({ lat: latlng.getLat(), lng: latlng.getLng() })
  }, [])

  return (
    <div className="app">
      <Header />
      <div className="controls">
        <SearchBar onSearch={handleSearch} />
        {meta && (
          <p className="data-meta">
            {meta.totalBlogs}개 블로그 분석 · {new Date(meta.lastUpdated).toLocaleDateString('ko-KR')} 기준
          </p>
        )}
      </div>
      <div className="main-content">
        <aside className="sidebar">
          <PlaceList
            places={filteredPlaces}
            isLoading={isLoading}
            error={error}
            selectedId={selectedPlace?.id ?? null}
            onSelect={handlePlaceSelect}
            renderAfterSelected={() =>
              selectedPlace ? (
                <BlogReviews
                  posts={blogPosts}
                  isLoading={blogLoading}
                  error={blogError}
                  placeName={selectedPlace.place_name}
                />
              ) : null
            }
          />
        </aside>
        <MapView
          places={filteredPlaces}
          center={center}
          level={level}
          selectedPlace={selectedPlace}
          onMarkerClick={handleMarkerClick}
          onCenterChanged={handleCenterChanged}
        />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <KakaoMapLoader>
      <AppContent />
    </KakaoMapLoader>
  )
}
