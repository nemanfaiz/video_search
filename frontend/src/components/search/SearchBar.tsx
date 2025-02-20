import { useState } from 'react'
import { SearchResponse, SearchResult } from '@/types/search'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => Promise<void>
  isLoading: boolean
  searchResult: SearchResponse | null
  onSeek: (timestamp: number) => Promise<void>
}

export function SearchBar({ onSearch, isLoading, searchResult, onSeek }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query)
    }
  }

  const renderSearchResults = () => {
    if (!searchResult) return null
    if ('error' in searchResult) return <p className="text-red-500">{searchResult.error}</p>
    if (searchResult.length === 0) return <p>No results found</p>

    return (
      <div className="space-y-3 mt-4">
        <h3 className="font-medium">Search Results:</h3>
        {searchResult.map((result: SearchResult, index: number) => (
          <div key={index} className="p-3 bg-gray-100 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <Button 
                variant="ghost" 
                onClick={() => onSeek(result.timestamp)}
                className="text-blue-600 hover:text-blue-800"
              >
                Jump to {result.formattedTime}
              </Button>
              <span className="text-sm text-gray-600">
                Confidence: {result.confidence}%
              </span>
            </div>
            <p className="text-sm text-gray-700">{result.text}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search video content..."
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching
            </>
          ) : (
            'Search'
          )}
        </Button>
      </form>
      {renderSearchResults()}
    </div>
  )
}