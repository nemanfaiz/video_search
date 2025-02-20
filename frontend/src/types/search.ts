
export interface SearchRequest {
  video_id: string;
  query: string;
}

// export interface SearchResponse {
//   timestamp?: number;
//   text?: string;
//   message?: string;
//   error?: string;
// }

export interface SearchResult {
  timestamp: number
  text: string
  confidence: number
  question_type: string
  formattedTime: string
}

export type SearchResponse = SearchResult[] | { error: string }

export interface VideoWithSearch {
  isSearching?: boolean;
  searchResult?: SearchResponse;
}