"use client"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { VideoForPlayer } from "@/types/video"
import { VideoPlayer } from "./VideoPlayer"
import { SearchBar } from "@/components/search/SearchBar"
import { SearchResponse } from "@/types/search"
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface VideoModalProps {
  video: VideoForPlayer
  isOpen: boolean
  onClose: () => void
}

export function VideoModal({ video, isOpen, onClose }: VideoModalProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const handleSearch = async (query: string) => {
    setIsSearching(true)
    try {
      const response = await fetch('http://localhost:8000//api/videos/search', {
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
    const video = videoRef.current;
    if (!video) return;

    try {
      const wasPlaying = !video.paused;
      const newTime = Math.min(Math.max(0, timestamp), video.duration);
      
      // pause then seek
      video.pause();
      video.currentTime = newTime;
      
      // wait for seeking to complete
      await new Promise<void>((resolve) => {
        const handleSeeked = () => {
          video.removeEventListener('seeked', handleSeeked);
          resolve();
        };
        video.addEventListener('seeked', handleSeeked);
      });
      
      // resume if it was playing
      if (wasPlaying) {
        try {
          await video.play();
        } catch (error) {
          if (error instanceof Error && error.name === 'NotAllowedError') {
            console.warn('Autoplay prevented by browser policy');
          } else {
            console.error('Playback error:', error);
          }
        }
      }
    } catch (error) {
      console.error('Seek operation failed:', error);
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0" >
        <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>{video.title}</DialogTitle>
            </VisuallyHidden>
          </DialogHeader>
        <div className="p-6 space-y-4">
          <VideoPlayer
            ref={videoRef}
            src={video.streamUrl}
            title={video.title}
          />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{video.title}</h2>
            <SearchBar
              onSearch={handleSearch}
              isLoading={isSearching}
              searchResult={searchResult}
              onSeek={handleSeek}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}