from channels.generic.websocket import AsyncJsonWebsocketConsumer
from services.transcript_service import TranscriptService
from services.video_service import VideoService
import json
import asyncio
from django.http import JsonResponse
import traceback
from services.openai_service import OpenAIService
from typing import Optional, Dict, Any, List, Union


class VideoChatConsumer(AsyncJsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.video_service = VideoService()
        self.openai_service = OpenAIService()
        self.room_group_name = None
        self.video_id = None

    async def process_message(
        self, 
        message: str, 
        video_info: Dict[str, Any], 
        current_timestamp: Optional[float]
    ) -> Dict[str, Any]:
        """Process incoming message using OpenAI
        
        Args:
            message: The user's input message
            video_info: Dictionary containing video information
            current_timestamp: Optional timestamp of current video position
            
        Returns:
            Dict containing the OpenAI response
            
        Raises:
            Exception: If message processing fails
        """
        video_itself = self.scope['url_route']['kwargs']['video_id']
        self.video_id = video_itself
        
        video_info = await self.video_service.get_video_info(self.video_id)

        if not video_info:
            return JsonResponse({'error': 'Video not found'}, status=404)

        try:
            response = await self.openai_service.get_chat_response(
                question=message,
                transcript=video_info['transcript']
            )
            
            return response

        except Exception as e:
            print(f"Error processing message: {e}")
            raise
        
    
    async def receive_json(self, content: Dict[str, Any]) -> None:
        """Handle incoming JSON messages
        
        Args:
            content: Dictionary containing the message content
            
        Raises:
            ValueError: If required message fields are missing
            Exception: If message processing fails
        """
        
        try:
            
            print(f"Received message: {content}")
            message_type = content.get('type')

            if message_type == 'connection.check':
                await self.send_json({
                    'type': 'connection.established',
                    'message': 'Connected successfully'
                })
                return

            if message_type == 'chat.message':
                message = content.get('message')
                if not message:
                    raise ValueError("Message is required")
                
                video_info = await self.video_service.get_video_info(self.video_id)
                response = await self.process_message(
                    message,
                    video_info,
                    content.get('timestamp')
                )
                await self.send_json(response)
                return

            print(f"Unhandled message type: {message_type}")

        except Exception as e:
            print(f"Error in receive_json: {str(e)}")
            print(traceback.format_exc())
            if not self.closed:
                await self.send_error(str(e))
    
    def _format_response(self, search_results: List[Dict[str, Any]]) -> str:
        """Format chat response with relevant information
        
        Args:
            search_results: List of search result dictionaries
            
        Returns:
            Formatted response string
        """
        if not search_results:
            return "I couldn't find any relevant information."

        best_match = search_results[0]
        response = best_match['text']
        
        timestamp = best_match['timestamp']
        minutes = int(timestamp // 60)
        seconds = int(timestamp % 60)
        
        return f"{response} (Found at {minutes}:{seconds:02d})"
    
    async def connect(self) -> None:
        """Handle WebSocket connection
        
        Raises:
            Exception: If connection fails
        """

        try:
            self.video_id = self.scope['url_route']['kwargs']['video_id']
            
            if self.video_id.startswith('video_'):
                self.video_id = self.video_id[6:] 
                
            self.room_group_name = f'chat_{self.video_id}'

            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            print(f"WebSocket connected for video {self.video_id}")

        except Exception as e:
            print(f"Connection error: {str(e)}")
            print(traceback.format_exc())
            if not self.closed:
                await self.close()
                
    async def disconnect(self, close_code: int) -> None:
        """Handle WebSocket disconnection
        
        Args:
            close_code: WebSocket close code
        """
        try:
            print(f"WebSocket disconnected with code {close_code}")
            if hasattr(self, 'room_group_name'):
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
        except Exception as e:
            print(f"Disconnect error: {str(e)}")
            print(traceback.format_exc())
            
    async def send_error(self, error_message: str) -> None:
        """Send error message to client
        
        Args:
            error_message: Error message to send
        """
        await self.send_json({
            'type': 'chat.error',
            'message': error_message
        })