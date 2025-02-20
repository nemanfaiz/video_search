import { VideoWithSearch } from "@/components/video/VideoWithSearch"
import { notFound } from "next/navigation"
import { getVideoForPlayer } from "@/lib/api/videos"

interface VideoPageProps {
    params: {
      videoId: string
    }
    searchParams?: {
      [key: string]: string | string[] | undefined
    }
  }
  
export default async function VideoPage({ params, searchParams }: VideoPageProps) {
    const videoData = searchParams?.data
    if (!videoData || typeof videoData !== 'string') {
        return notFound()
    }

    try {
        const video = JSON.parse(decodeURIComponent(videoData))
        const videoPlayer = await getVideoForPlayer(video)
  
        if (!videoPlayer) {
            notFound()
        }

        // const videoForPlayer = {
        //     video_id: video.video_id,
        //     title: video.title,
        //     streamUrl: `http://localhost:8000/api/videos/stream/${video.video_id}`,
        // }

        return (
            <div className="min-h-screen bg-background">
            <VideoWithSearch video={videoPlayer} />
            </div>
        )

    } catch (e) {
        console.error('Failed to parse video data:', e)
    }
}