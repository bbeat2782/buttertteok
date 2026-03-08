import { regions, type Region } from '../utils/regions'

interface RegionFilterProps {
  selectedRegion: Region
  onSelect: (region: Region) => void
}

export default function RegionFilter({ selectedRegion, onSelect }: RegionFilterProps) {
  return (
    <div className="region-filter">
      {regions.map((region) => (
        <button
          key={region.name}
          className={`region-pill ${selectedRegion.name === region.name ? 'active' : ''}`}
          onClick={() => onSelect(region)}
        >
          {region.name}
        </button>
      ))}
    </div>
  )
}
