import { useState, useEffect, type ReactNode } from 'react'

interface KakaoMapLoaderProps {
  children: ReactNode
}

export default function KakaoMapLoader({ children }: KakaoMapLoaderProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (window.kakao?.maps?.LatLng) {
      setLoaded(true)
      return
    }

    if (window.kakao?.maps?.load) {
      kakao.maps.load(() => setLoaded(true))
      return
    }

    setError('Kakao Maps SDK를 불러오지 못했습니다. index.html의 스크립트 태그를 확인해주세요.')
  }, [])

  if (error) {
    return (
      <div className="loader-error">
        <p>{error}</p>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="loader-loading">
        <p>지도를 불러오는 중...</p>
      </div>
    )
  }

  return <>{children}</>
}
