import { UploadButton } from "@/components/video/UploadButton"
import { VideoGrid } from "@/components/video/VideoGrid"

export default function VideosPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Videos</h1>
          <p className="text-muted-foreground">Click on the video which you like to interact with</p>
        </div>
        <UploadButton />
      </div>
      
      <VideoGrid />
    </div>
  )
}