import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk'
import type { Place } from '../types/kakao'

interface MapViewProps {
  places: Place[]
  center: { lat: number; lng: number }
  level: number
  selectedPlace: Place | null
  onMarkerClick: (place: Place | null) => void
  onCenterChanged: (map: kakao.maps.Map) => void
}

export default function MapView({
  places,
  center,
  level,
  selectedPlace,
  onMarkerClick,
  onCenterChanged,
}: MapViewProps) {
  return (
    <div className="map-container">
      <Map
        center={center}
        level={level}
        className="kakao-map"
        onCenterChanged={onCenterChanged}
      >
        {places.map((place) => (
          <MapMarker
            key={place.id}
            position={{ lat: Number(place.y), lng: Number(place.x) }}
            onClick={() => onMarkerClick(place)}
          />
        ))}

        {selectedPlace && (
          <CustomOverlayMap
            position={{
              lat: Number(selectedPlace.y),
              lng: Number(selectedPlace.x),
            }}
            yAnchor={1.4}
          >
            <div className="map-overlay">
              <div className="map-overlay-content">
                <h4>{selectedPlace.place_name}</h4>
                <p>{selectedPlace.road_address_name || selectedPlace.address_name}</p>
                {selectedPlace.phone && <p className="overlay-phone">{selectedPlace.phone}</p>}
                {selectedPlace.place_url && (
                  <a
                    href={selectedPlace.place_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    상세보기
                  </a>
                )}
              </div>
              <button
                className="map-overlay-close"
                onClick={() => onMarkerClick(null)}
              >
                ✕
              </button>
            </div>
          </CustomOverlayMap>
        )}
      </Map>
    </div>
  )
}
