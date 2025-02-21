export interface Message {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamps?: number[];
  confidence?: number;
  createdAt: Date;
}

export interface WebSocketMessage {
  type: string;
  message: string;
  timestamp: number;
}