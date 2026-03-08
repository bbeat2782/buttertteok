import { useState } from 'react'

interface SearchBarProps {
  onSearch: (region: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(value.trim())
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="지역명으로 검색 (예: 종로, 강남, 부산)"
        className="search-input"
      />
    </form>
  )
}
