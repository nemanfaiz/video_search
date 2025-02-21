import client from './client'
import axios from 'axios'
import { SearchRequest, SearchResult } from '@/types/search'

export const searchVideo = async (
  videoId: string,
  query: string
): Promise<SearchResult[]> => {
  try {
    const searchRequest: SearchRequest = {
      video_id: videoId,
      query: query.trim()
    }

    const { data } = await client.post<{ results: SearchResult[] }>(
      '/videos/search',
      searchRequest
    )

    // Process and sort the results
    return data.results
      .map(result => ({
        ...result,
        formattedTime: formatTimestamp(result.timestamp),
        confidence: Math.round(result.confidence * 100)
      }))
      .sort((a, b) => b.confidence - a.confidence)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }
    throw new Error('Failed to search video content')
  }
}


export const formatTimestamp = (seconds: number): string => {
  const date = new Date(seconds * 1000)
  return date.toISOString().substr(14, 5)
}

export const validateSearchQuery = (query: string): boolean => {
  const trimmedQuery = query.trim()
  return trimmedQuery.length >= 2 && trimmedQuery.length <= 100
}