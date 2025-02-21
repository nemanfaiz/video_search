"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { uploadVideo } from "@/lib/api/videos"
import { useToast } from "@/hooks/use-toast"

export function VideoUploader() {
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // if video is under 3 minutes
      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src)
        const duration = video.duration
        
        // 3 minutes in seconds
        if (duration > 180) { 
          alert('Video must be under 3 minutes')
          return
        }
        
        setFile(selectedFile)
      }

      video.src = URL.createObjectURL(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    
    // const interval = setInterval(() => {
    //   setProgress((prev) => {
    //     if (prev >= 100) {
    //       clearInterval(interval)
    //       return 100
    //     }
    //     return prev + 10
    //   })
    // }, 500)

    try {
      await uploadVideo(file, title, (uploadProgress) => {
        setProgress(uploadProgress)
      });
  
      toast({
        title: "Upload successful",
        description: "Your video has been uploaded successfully.",
      })
  
      setUploading(false)
      setProgress(0)
      setFile(null)
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
    
    // setTimeout(() => {
    //   setUploading(false)
    //   setProgress(0)
    //   setFile(null)
    // }, 5000)
  }

  return (
    <Card className="p-6">
      {!file ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="video-upload"
          />
          <label
            htmlFor="video-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Drop your video here</h3>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse (max 3 minutes)
            </p>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFile(null)}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Enter video title" value={title} onChange={(e) => setTitle(e.target.value)}/>
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground">
                  Uploading... {progress}%
                </p>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}