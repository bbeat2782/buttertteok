export interface Region {
  name: string
  lat: number
  lng: number
  level: number // Kakao map zoom level (1=closest, 14=farthest)
}

export const regions: Region[] = [
  { name: '전체', lat: 37.5665, lng: 126.978, level: 8 },
  { name: '강남', lat: 37.4979, lng: 127.0276, level: 5 },
  { name: '홍대/마포', lat: 37.5563, lng: 126.9236, level: 5 },
  { name: '종로', lat: 37.5729, lng: 126.9794, level: 5 },
  { name: '성수', lat: 37.5445, lng: 127.0557, level: 5 },
  { name: '잠실', lat: 37.5133, lng: 127.1001, level: 5 },
  { name: '여의도', lat: 37.5219, lng: 126.9245, level: 5 },
  { name: '수원', lat: 37.2636, lng: 127.0286, level: 5 },
  { name: '분당', lat: 37.3595, lng: 127.1059, level: 5 },
  { name: '부산', lat: 35.1796, lng: 129.0756, level: 8 },
  { name: '대구', lat: 35.8714, lng: 128.6014, level: 8 },
  { name: '대전', lat: 36.3504, lng: 127.3845, level: 8 },
]
