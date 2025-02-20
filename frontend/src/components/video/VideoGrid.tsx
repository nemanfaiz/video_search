"use client"

import { useState, useEffect } from "react"
import { VideoCard } from "./VideoCard"
import { Film } from "lucide-react"
import { VideoMetadata, VideosResponse } from "@/types/video"
import { getVideos } from "@/lib/api/videos"
import { useToast } from "@/hooks/use-toast"

export function VideoGrid() {
  const [videos, setVideos] = useState<VideoMetadata[]>([]) 
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchVideos = async () => {
    try {
      const response = await getVideos() as VideosResponse
      
      console.log("response ", response)
      const videosData = response.videos as VideoMetadata[]
      console.log("videosData ", videosData)

      setVideos(videosData || [])
    } catch (error) {
      toast({
        title: "Error fetching videos",
        description: error instanceof Error ? error.message : "Failed to load videos",
        variant: "destructive",
      })
      setVideos([]) 
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, []) 

  if (loading) {
    return (
      <div className="text-center py-12 bg-card border rounded-lg">
        <Film className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
        <h3 className="mt-2 text-sm font-semibold text-foreground">Loading videos...</h3>
      </div>
    )
  }

  return (
    <div>
      {videos.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-lg">
          <Film className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">No videos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by uploading a video.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard 
              key={video.video_id} 
              video={video} 
              onDelete={fetchVideos} 
            />
          ))}
        </div>
      )}
    </div>
  )
}