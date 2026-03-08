export interface Place {
  id: string
  place_name: string
  category_name: string
  phone: string
  address_name: string
  road_address_name: string
  x: string
  y: string
  place_url: string
  mention_count: number
}

export interface PlacesData {
  lastUpdated: string
  config: { days: number; minMentions: number }
  totalBlogsScraped: number
  places: Place[]
}
