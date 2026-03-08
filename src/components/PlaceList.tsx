import type { ReactNode } from 'react'
import PlaceCard from './PlaceCard'
import type { Place } from '../types/kakao'

interface PlaceListProps {
  places: Place[]
  isLoading: boolean
  error: string | null
  selectedId: string | null
  onSelect: (place: Place) => void
  renderAfterSelected?: () => ReactNode
}

export default function PlaceList({
  places,
  isLoading,
  error,
  selectedId,
  onSelect,
  renderAfterSelected,
}: PlaceListProps) {
  if (isLoading) {
    return <div className="place-list-status">데이터 로딩 중...</div>
  }

  if (error) {
    return <div className="place-list-status error">{error}</div>
  }

  if (places.length === 0) {
    return <div className="place-list-status">조건에 맞는 가게가 없습니다</div>
  }

  return (
    <div className="place-list">
      <div className="place-list-count">
        {places.length}개의 버터떡 가게
      </div>
      <div className="place-list-items">
        {places.map((place, i) => (
          <div key={place.id}>
            <PlaceCard
              place={place}
              index={i}
              isSelected={selectedId === place.id}
              onClick={() => onSelect(place)}
            />
            {selectedId === place.id && renderAfterSelected?.()}
          </div>
        ))}
      </div>
    </div>
  )
}
