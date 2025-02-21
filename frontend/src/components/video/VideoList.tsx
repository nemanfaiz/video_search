'use client'
import { useState, useEffect } from 'react'
import { Video } from '@/types/video'
import { formatDuration } from '@/lib/utils/format'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getThumbnailUrl, fetchVideoList } from '@/lib/api/videos'

interface VideoListProps {
  limit?: number
  userId?: string
  showThumbnail?: boolean
}

const formatVideoDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function VideoList({ 
  limit = 10, 
  userId,
  showThumbnail = true 
}: VideoListProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const response = await fetchVideoList({ 
          limit,
          userId,
          status: 'completed'
        })
        setVideos(response.videos)
      } catch (error) {
        console.error('Failed to fetch videos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadVideos()
  }, [limit])

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
      {videos.map((video : Video) => (
        <Link
          key={video.video_id}
          href={`/videos/${video.video_id}?data=${encodeURIComponent(JSON.stringify(video))}`}
          className="flex gap-4 p-2 rounded-lg hover:bg-accent transition-colors"
        >
          {showThumbnail && (
            <div className="relative flex-shrink-0 w-40 aspect-video rounded-md overflow-hidden bg-muted">
            <img 
              src={getThumbnailUrl(video.video_id)}
              alt={video.title}
              className="w-full h-full object-cover"
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
              Uploaded {formatVideoDate(video.created_at)}
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