export interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoUploadResponse {
  videoUrl: string;
  videoId: string;
}

export interface SearchResult {
  videoId: string;
  timestamp: number;
  confidence: number;
  text: string;
}

export interface VideoMetadata {
  video_id: string
  duration: number
  file_size: number
  width: number
  height: number
  created_at: string
  title: string
  processing_status: 'processing' | 'completed' | 'failed'
}

export interface VideosResponse {
  videos: VideoMetadata[]
}

export interface UploadVideoResponse extends VideoMetadata {}

export interface ProcessingStatus {
  video_id: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
}

export interface VideoUploadError {
  error: string
}

export interface VideoForPlayback {
  video_id: string
  title: string
  streamUrl: string
}

export interface VideoForPlayer {
  video_id: string
  title: string
  streamUrl: string
}

export const getVideoForPlayer = (video: VideoMetadata): VideoForPlayer => {
  return {
    video_id: video.video_id,
    title: video.title || 'Untitled Video',
    streamUrl: `/api/videos/stream/${video.video_id}`
  }
}