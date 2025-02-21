import { Message, WebSocketMessage } from '@/types/chat';
  
export class ChatAPI {
    private ws: WebSocket | null = null;
    private videoId: string;
    private onMessageCallback: (message: Message) => void;
    private onConnectionChange: (status: boolean) => void;

    constructor(
        videoId: string,
        onMessage: (message: Message) => void,
        onConnectionChange: (status: boolean) => void
    ) {
        this.videoId = videoId;
        this.onMessageCallback = onMessage;
        this.onConnectionChange = onConnectionChange;
    }

    connect() {
        this.ws = new WebSocket(
        `ws://localhost:8000/ws/videos/chat/${this.videoId}`
        );

        this.ws.onopen = () => {
        this.onConnectionChange(true);
        };

        this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const newMessage: Message = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'bot',
            message: data.message,
            confidence: data.confidence,
            timestamps: data.timestamps || [],
            createdAt: new Date()
        };
        this.onMessageCallback(newMessage);
        };

        this.ws.onclose = () => {
        this.onConnectionChange(false);
        };
    }

    disconnect() {
        if (this.ws) {
        this.ws.close();
        this.ws = null;
        }
    }

    sendMessage(message: string): Message | null {
        if (!message.trim() || !this.ws) return null;

        const wsMessage: WebSocketMessage = {
        type: 'chat.message',
        message: message,
        timestamp: Math.floor(Date.now() / 1000)
        };

        this.ws.send(JSON.stringify(wsMessage));

        const userMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'user',
        message: message,
        createdAt: new Date()
        };

        return userMessage;
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}