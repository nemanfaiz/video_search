import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send } from 'lucide-react';

export default function ChatInterface() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const wsRef = useRef(null);
  const scrollRef = useRef(null);
  const videoId = 'video_989c9517-c1a2-4986-8f49-c9a949bb227a';

  useEffect(() => {
    wsRef.current = new WebSocket(
      `ws://localhost:8000/ws/videos/video_${videoId}/chat/`
    );

    wsRef.current.onopen = () => {
      setConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("data nmsg ", data)
      const newMessage = {
        type: 'bot',
        text: data.message,
        timestamp: new Date(),
        confidence: data.confidence
      };
      setMessages(prev => [...prev, newMessage]);
    };

    wsRef.current.onclose = () => {
      setConnected(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const message = {
      type: 'chat.message',
      message: inputMessage,
      timestamp: Math.floor(Date.now() / 1000)
    };

    wsRef.current.send(JSON.stringify(message));
    setMessages(prev => [...prev, {
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    }]);
    setInputMessage('');
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="border-b bg-white">
        <div className="p-4 flex items-center gap-4">
          <button className="hover:bg-gray-100 p-2 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Chat with Video</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[32rem] bg-gray-50" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] space-y-1 ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3 rounded-2xl ${
                    msg.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
                
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs text-gray-500">
                    {formatTime(msg.timestamp)}
                  </span>
                  {msg.type === 'bot' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {(msg.confidence * 100).toFixed(1)}% confident
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!connected}
            variant="default"
            size="icon"
            className="rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}