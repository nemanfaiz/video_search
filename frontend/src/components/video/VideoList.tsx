'use client'
import { useState, useEffect } from 'react'
import { Video } from '@/types/video'
import { formatDuration, timeAgo } from '@/lib/utils/format'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface VideoListProps {
  limit?: number
  userId?: string
  showThumbnail?: boolean
}

export function VideoList({ 
  limit = 10, 
  userId,
  showThumbnail = true 
}: VideoListProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // Replace with actual API call
        const response = await fetch(`/api/videos?limit=${limit}${userId ? `&userId=${userId}` : ''}`)
        const data = await response.json()
        setVideos(data)
      } catch (error) {
        console.error('Failed to fetch videos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [limit, userId])

  if (loading) {
    return <VideoListSkeleton count={limit} showThumbnail={showThumbnail} />
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No videos found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/videos/${video.id}`}
          className="flex gap-4 p-2 rounded-lg hover:bg-accent transition-colors"
        >
          {showThumbnail && (
            <div className="relative flex-shrink-0 w-40 aspect-video rounded-md overflow-hidden">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="object-cover"
              />
              <div className="absolute bottom-1 right-1 bg-black/75 text-white text-xs px-1 rounded">
                {formatDuration(video.duration)}
              </div>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{video.title}</h4>
            {video.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {video.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {timeAgo(video.createdAt)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

function VideoListSkeleton({ count, showThumbnail }: { count: number, showThumbnail: boolean }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 p-2">
          {showThumbnail && (
            <Skeleton className="w-40 aspect-video rounded-md" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}