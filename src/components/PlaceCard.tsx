import type { Place } from '../types/kakao'

interface PlaceCardProps {
  place: Place
  index: number
  isSelected: boolean
  onClick: () => void
}

export default function PlaceCard({ place, index, isSelected, onClick }: PlaceCardProps) {
  return (
    <div
      className={`place-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="place-card-index">{index + 1}</div>
      <div className="place-card-info">
        <div className="place-card-name-row">
          <h3 className="place-card-name">{place.place_name}</h3>
          <span className="place-card-mentions">{place.mention_count}회 언급</span>
        </div>
        <p className="place-card-address">
          {place.road_address_name || place.address_name}
        </p>
        {place.phone && (
          <p className="place-card-phone">{place.phone}</p>
        )}
        {place.category_name && (
          <p className="place-card-category">{place.category_name}</p>
        )}
      </div>
      <div className="place-card-actions">
        {place.place_url && (
          <a
            className="place-card-link"
            href={place.place_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            상세
          </a>
        )}
        <a
          className="place-card-link place-card-insta"
          href={`https://www.instagram.com/explore/tags/${encodeURIComponent(place.place_name)}/`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="인스타그램에서 보기"
        >
          IG
        </a>
      </div>
    </div>
  )
}
