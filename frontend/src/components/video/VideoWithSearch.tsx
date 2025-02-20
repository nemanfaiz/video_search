"use client"

import { useState, useRef } from "react"
import { VideoPlayer } from "./VideoPlayer"
import { SearchBar } from "@/components/search/SearchBar"
import { VideoForPlayer } from "@/types/video"
import { SearchResponse } from "@/types/search"
import { Button } from "@/components/ui/button"
import { MessageCircle, Search, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { ChatContainer } from "@/components/chat/ChatContainer"
import WebSocketTest from '@/components/chat/WebSocketTest';

interface VideoWithSearchProps {
  video: VideoForPlayer
}

export function VideoWithSearch({ video }: VideoWithSearchProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'search' | 'chat'>('search')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)


    const handleSearch = async (query: string) => {
        setIsSearching(true)
        try {
        const response = await fetch('http://localhost:8000/api/videos/search', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            video_id: video.video_id,
            query: query.trim()
            }),
        })

        const data = await response.json()
        // setSearchResult(data)
        console.log("data", data["results"])
        const dataArray = data["results"]

        // parse the data to formatted time and sort by confidence
        const processedResults = Array.isArray(dataArray) ? dataArray.map(result => ({
            ...result,
            formattedTime: new Date(result.timestamp * 1000).toISOString().substr(14, 5),
            confidence: Math.round(result.confidence * 100)
        })).sort((a, b) => b.confidence - a.confidence) : []
        
        setSearchResult(processedResults)

        } catch (error) {
          setSearchResult({ error: 'Failed to search video content' })
        } finally {
          setIsSearching(false)
        }
    }

  const handleSeek = async (timestamp: number) => {
    if (!videoRef.current) return
    try {
      const wasPlaying = !videoRef.current.paused
      videoRef.current.currentTime = timestamp
      if (wasPlaying) await videoRef.current.play()
    } catch (error) {
      console.error('Seek failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* header */}
      <header className="border-b">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push('/videos')}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-semibold">{video.title}</h1>
          </div>
        </div>
      </header>

      {/* main card */}
      <div className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="flex gap-6">
          <div className={cn(
            "transition-all duration-300 ease-in-out flex-1",
            isChatOpen ? "mr-[400px]" : "mr-0"
          )}>
            <div className="bg-black rounded-lg overflow-hidden">
              <VideoPlayer
                ref={videoRef}
                src={video.streamUrl}
                title={video.title}
              />
            </div>
            <div className="mt-6">
              <SearchBar
                onSearch={handleSearch}
                isLoading={isSearching}
                searchResult={searchResult}
                onSeek={handleSeek}
              />
            </div>
          </div>
          

          {/* chat bar */}
          <div className={cn(
              "fixed right-0 top-0 bottom-0 w-[400px] bg-card border-l shadow-lg transition-transform duration-300 ease-in-out transform",
              isChatOpen ? "translate-x-0" : "translate-x-full"
            )}>
              {/* chat toggle */}
              <div className="absolute -left-12 top-1/2 -translate-y-1/2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-24 w-12 rounded-l-lg rounded-r-none shadow-lg"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                >
                  <MessageCircle className="h-6 w-6" />
                </Button>
              </div>

              <div className="flex flex-col h-[1100px] mt-4">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Chat with Video</h2>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsChatOpen(false)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="h-full overflow-hidden">
                  <ChatContainer 
                    // videoId={"video_video_0efc26cf-5ccf-4296-bd9a-5bba811ac45c"}
                    videoId={video.video_id}
                    onTimestampClick={handleSeek}
                  />
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}