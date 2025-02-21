import React, { useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatAPI } from '@/lib/api/chat';

interface Message {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamps?: number[];
  confidence?: number;
  createdAt: Date;
}

interface ChatContainerProps {
  videoId: string;
  onTimestampClick?: (timestamp: number) => void;
  className?: string;
}

export function ChatContainer({
  videoId,
  onTimestampClick,
  className
}: ChatContainerProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [inputMessage, setInputMessage] = React.useState('');
  const chatApiRef = useRef<ChatAPI | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatApiRef.current = new ChatAPI(
      videoId,
      (newMessage) => setMessages(prev => [...prev, newMessage]),
      (status) => setIsConnected(status)
    );
    
    chatApiRef.current.connect();

    return () => {
      chatApiRef.current?.disconnect();
    };
  }, [videoId]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [messages]);

  const sendMessage = () => {
    if (!chatApiRef.current) return;

    const userMessage = chatApiRef.current.sendMessage(inputMessage);
    if (userMessage) {
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const formatVideoTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* header */}
      <div className="flex-none border-b bg-white p-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500"
          )} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* bot container */}
      <div className="flex-1 overflow-hidden">
        <div ref={scrollRef} className="h-full overflow-y-auto">
          
          {/* messages */}
          <div className="p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.type === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[80%] space-y-1",
                  msg.type === 'user' ? "items-end" : "items-start"
                )}>
                  {/* each message content */}
                  <div className={cn(
                    "p-3 rounded-2xl",
                    msg.type === 'user'
                      ? "bg-blue-500 text-white"
                      : "bg-slate-700 text-white"
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>

                  </div>

                  {/* message confidence */}
                  <div className="flex flex-col gap-1 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formatTime(msg.createdAt)}
                      </span>
                      {msg.type === 'bot' && typeof msg.confidence === 'number' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {(msg.confidence * 100).toFixed(1)}% confident
                        </span>
                      )}
                    </div>
                    
                    {/* message timestamps */}
                    {msg.type === 'bot' && msg.timestamps && msg.timestamps.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.timestamps.map((timestamp, index) => (
                          <button
                            key={index}
                            onClick={() => onTimestampClick?.(timestamp)}
                            className="text-xs px-2 py-1 bg-yellow-300 hover:bg-red-200 rounded-full text-gray-700 transition-colors"
                          >
                            {formatVideoTimestamp(timestamp)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* chat bot text area */}
      <div className="flex-none border-t bg-white p-4">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 min-h-[60px] max-h-[120px] p-2 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={!isConnected}
            rows={2}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!isConnected}
            variant="outline"
            size="icon"
            className="shrink-0 rounded-full h-[60px] w-[60px]"
          >
            <Send className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}