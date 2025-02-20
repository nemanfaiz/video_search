"use client"

import { useState } from "react"
import { VideoPlayer } from "@/components/video/VideoPlayer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VideoWithSearchProps {
  videoId: string
  title: string
  src: string
}

export function VideoWithSearch({ videoId, title, src }: VideoWithSearchProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResult, setSearchResult] = useState<{
    timestamp?: number
    text?: string
    message?: string
    error?: string
  } | null>(null)
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch('/api/videos/search/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_id: videoId,
          query: searchQuery.trim()
        }),
      })

      const data = await response.json()
      setSearchResult(data)

      // If we have a timestamp and video reference, seek to that position
      if (data.timestamp !== undefined && videoRef) {
        videoRef.currentTime = data.timestamp
        videoRef.play()
      }
    } catch (error) {
      setSearchResult({ error: 'Failed to search video content' })
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-4">
      <VideoPlayer
        src={src}
        title={title}
        ref={(ref) => setVideoRef(ref)}
      />
      
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in video..."
          className="flex-1"
          disabled={isSearching}
        />
        <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
          {isSearching ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      {searchResult && (
        <Alert variant={searchResult.error ? "destructive" : "default"}>
          <AlertDescription>
            {searchResult.error ? searchResult.error : 
             searchResult.message ? searchResult.message :
             searchResult.text ? (
               <div className="space-y-1">
                 <p>{searchResult.text}</p>
                 {searchResult.timestamp !== undefined && (
                   <p className="text-sm text-muted-foreground">
                     Found at {Math.floor(searchResult.timestamp)}s
                   </p>
                 )}
               </div>
             ) : null}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}