import client from './client'
import axios from 'axios'
import { UploadVideoResponse, ProcessingStatus, VideosResponse, VideoMetadata, VideoForPlayer } from '@/types/video'

export const uploadVideo = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadVideoResponse> => {
  const formData = new FormData()
  formData.append('video', file)

  try {
    const { data } = await client.post<UploadVideoResponse>('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress?.(progress)
        }
      },
    })
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw new Error('Failed to upload video')
  }
}

export const getProcessingStatus = async (videoId: string): Promise<ProcessingStatus> => {
  try {
    const { data } = await client.get<ProcessingStatus>(`/status/${videoId}`)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw new Error('Failed to get processing status')
  }
}

export const getVideos = async (): Promise<VideosResponse> => {
  try {
    const { data } = await client.get<VideosResponse>('/videos/get')
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw new Error('Failed to fetch videos')
  }
}

export const deleteVideo = async (videoId: string): Promise<void> => {
  try {
    await client.delete(`/videos/${videoId}`)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw new Error('Failed to delete video')
  }
}

// export const getVideoStream = async (videoId: string): Promise<VideoStreamResponse> => {
//   try {
//     const { data } = await client.get<VideoStreamResponse>(`/videos/${videoId}/stream`)
//     return data
//   } catch (error) {
//     if (axios.isAxiosError(error) && error.response?.data?.error) {
//       throw new Error(error.response.data.error)
//     }
//     throw new Error('Failed to get video stream')
//   }
// }

// export const getVideoStreamUrl = (videoId: string): string => {
//   return `/api/videos/${videoId}/stream`
// }

export const getVideoForPlayer = (video: VideoMetadata): VideoForPlayer => {
  return {
    video_id: video.video_id,
    title: video.title || 'Untitled Video',
    streamUrl: `${client.defaults.baseURL}/videos/stream/${video.video_id}`
  }
}