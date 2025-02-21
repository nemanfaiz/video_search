import client from './client'
import axios from 'axios'
import {
  Video,
  UploadVideoResponse,
  ProcessingStatus,
  VideoListResponse,
  VideoListParams,
  VideoMetadata,
  VideoForPlayer,
  VideosResponse
} from '@/types/video'


export const uploadVideo = async (
  file: File,
  title: string,
  onProgress?: (progress: number) => void
): Promise<UploadVideoResponse> => {
  
  const formData = new FormData()
  formData.append('video', file)
  formData.append('title', title)

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
    await client.delete(`/videos/delete/${videoId}`)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw new Error('Failed to delete video')
  }
}


export const getVideoForPlayer = (video: VideoMetadata): VideoForPlayer => {
  return {
    video_id: video.video_id,
    title: video.title || 'Untitled Video',
    streamUrl: `${client.defaults.baseURL}/videos/stream/${video.video_id}`
  }
}

export const getThumbnailUrl = (videoId: string): string => {
  return `${client.defaults.baseURL}/videos/thumbnail/${videoId}`
}

export const fetchVideoList = async (params: VideoListParams = {}): Promise<VideoListResponse> => {
  try {

    const queryParams = new URLSearchParams()
    
    if (params.limit) {
      queryParams.append('limit', params.limit.toString())
    }

    const query = queryParams.toString()
    const url = `/videos/get${query ? `?${query}` : ''}`

    const { data } = await client.get<VideoListResponse>(url)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw new Error('Failed to fetch video list')
  }
}

export const fetchVideoById = async (videoId: string): Promise<Video> => {
  try {
    const { data } = await client.get<Video>(`/videos/${videoId}`)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw new Error('Failed to fetch video')
  }
}


