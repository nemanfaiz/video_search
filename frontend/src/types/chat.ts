export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: number;
  videoId?: string;
}

export interface ChatSession {
  id: string;
  videoId: string;
  messages: Message[];
}