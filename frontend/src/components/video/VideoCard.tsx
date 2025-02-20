"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Film, MoreVertical, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { VideoMetadata } from "@/types/video"
import { deleteVideo, getVideoForPlayer } from "@/lib/api/videos"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { VideoModal } from "./VideoModal"

interface VideoCardProps {
  video: VideoMetadata,
  onDelete?: () => void
}

export function VideoCard({ video, onDelete }: VideoCardProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteVideo(video.video_id)
      toast({
        title: "Video deleted",
        description: "The video has been successfully deleted.",
      })
      onDelete?.()
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete video",
        variant: "destructive",
      })
    }
  }

  // format duration from seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }


  // const handleVideoClick = () => {
  //   if (video.processing_status !== 'processing') {
  //     const videoForPlayer = getVideoForPlayer(video)
  //     setIsModalOpen(true)
  //   }
  // }
  const handleVideoClick = () => {
  if (video.processing_status !== 'processing') {
    const videoData = encodeURIComponent(JSON.stringify(video))
    router.push(`/videos/${video.video_id}?data=${videoData}`)
  }
}
  // const videoForModal = {
  //   title: video.title || "Untitled Video",
  //   src: `/api/videos/${video.video_id}/stream` // Adjust this to your actual video stream endpoint
  // }

  return (
    <>
      <Card className="overflow-hidden">
        <div 
          className="aspect-video bg-muted relative group cursor-pointer"
          onClick={handleVideoClick}
        >
          <div className="w-full h-full flex items-center justify-center">
            <Film className="h-10 w-10 text-muted-foreground" />
          </div>

          {video.processing_status !== 'processing' && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="rounded-full bg-white/20 p-3">
                <Play className="h-8 w-8 text-white" />
              </div>
            </div>
          )}

          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
            {formatDuration(video.duration)}
          </div>
          {video.processing_status === 'processing' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white text-sm font-medium">Processing...</p>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-base text-foreground line-clamp-1">
                {video.title || "Untitled Video"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                {' • '}
                {(video.file_size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="-mr-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* <VideoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        // video={videoForModal}
        video={getVideoForPlayer(video)}
      /> */}
    </>
  )
}