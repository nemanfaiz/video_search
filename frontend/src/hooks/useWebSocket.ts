import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  id: string
  type: 'user' | 'bot'
  message: string
  timestamps?: number[]
  confidence?: number
  createdAt: Date
}

interface ChatResponse {
  type: string
  message: string
  timestamps?: number[]
  confidence?: number
}

interface UseChatWebSocketProps {
  videoId: string
  onError?: (error: string) => void
}

export function useChatWebSocket({ videoId, onError }: UseChatWebSocketProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxReconnectAttempts = 5

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      const ws = wsRef.current
      wsRef.current = null

      if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Cleanup')
      }
    }
  }, [])

  const connect = useCallback(() => {
    try {
      const cleanVideoId = videoId.replace(/^video_/, '')
      const wsUrl = `ws://localhost:8000/ws/videos/video_${cleanVideoId}/chat/`
      console.log('Connecting to WebSocket:', wsUrl)
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connection opened')
        setIsConnected(true)
        reconnectAttempts.current = 0
        
        ws.send(JSON.stringify({
          type: 'connection.check',
          message: 'Initial connection'
        }))
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        setIsConnected(false)

        if (event.code !== 1000) {
          reconnectAttempts.current += 1
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
            console.log(`Reconnecting in ${delay}ms... Attempt ${reconnectAttempts.current}`)
            reconnectTimeoutRef.current = setTimeout(connect, delay)
          } else {
            onError?.('Maximum reconnection attempts reached')
          }
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onmessage = (event) => {
        try {
          console.log('Received message:', event.data)
          const response: ChatResponse = JSON.parse(event.data)
          
          if (response.type === 'connection.established') {
            console.log('Connection established')
            return
          }
          
          if (response.type === 'chat.message') {
            setIsTyping(false)
            setMessages(prev => [...prev, {
              id: uuidv4(),
              type: 'bot',
              message: response.message,
              timestamps: response.timestamps,
              confidence: response.confidence,
              createdAt: new Date()
            }])
          } else if (response.type === 'chat.error') {
            onError?.(response.message)
          }
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error)
      onError?.('Failed to initialize chat service')
    }
  }, [videoId, onError])

  useEffect(() => {
    connect()
    return () => cleanup()
  }, [videoId]) 
  
  return {
    messages,
    isConnected,
    isTyping,
    sendMessage: useCallback((message: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        onError?.('Chat service is not connected')
        return
      }

      try {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          type: 'user',
          message,
          createdAt: new Date()
        }])
        
        setIsTyping(true)

        wsRef.current.send(JSON.stringify({
          type: 'chat.message',
          message,
          timestamp: Math.floor(Date.now() / 1000)
        }))
      } catch (error) {
        console.error('Error sending message:', error)
        onError?.('Failed to send message')
        setIsTyping(false)
      }
    }, [onError]),
    reconnect: connect
  }
}