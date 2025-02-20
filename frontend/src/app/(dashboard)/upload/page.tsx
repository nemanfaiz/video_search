import { VideoUploader } from "@/components/video/VideoUploader"

export default function UploadPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Upload Video</h1>
        <p className="text-muted-foreground">Upload a new video to your library</p>
      </div>
      
      <VideoUploader />
    </div>
  )
}