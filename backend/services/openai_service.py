# services/openai_service.py
from typing import Dict, List, Optional, Set, Union, TypedDict, Any
from django.conf import settings
import asyncio
import json
import os
import re
from openai import AsyncOpenAI

class TranscriptSegment(TypedDict, total=False):
    """Type definition for a transcript segment"""
    text: str
    start: float
    timestamp: float

class ChatResponse(TypedDict):
    """Type definition for chat response"""
    type: str
    message: str
    timestamps: List[float]
    confidence: float
    

class OpenAIService:
    def __init__(self):
        self.client: AsyncOpenAI = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model: str = "gpt-3.5-turbo"
        
    async def get_chat_response(
        self, 
        question: str, 
        transcript: Union[Dict[str, Union[str, List[TranscriptSegment]]], Dict[str, str]]
    ) -> ChatResponse:
        """Get response from OpenAI using the video transcript as context
        
        Args:
            question: User's question about the video
            transcript: Video transcript in various possible formats
            
        Returns:
            Dict containing the response message and relevant timestamps
            
        Raises:
            Exception: If OpenAI API call fails
        """

        transcript_text = self._format_transcript(transcript)
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an AI assistant helping users understand a video content. "
                    "You have access to the video's transcript. When answering questions:\n"
                    "1. Reference specific parts of the transcript\n"
                    "2. Include timestamps when quoting content as long as it matches content partially or in concept always include timestamp\n"
                    "3. Be concise but informative\n"
                    "4. If information isn't in the transcript, say so\n"
                    f"\nHere's the transcript:\n{transcript_text}"
                )
            },
            {
                "role": "user",
                "content": question
            }
        ]
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
            response_content = response.choices[0].message.content

            timestamps = self._extract_timestamps(
                response_content,
                transcript
            )
            
            return {
                "type": "chat.message",
                "message": response_content,
                "timestamps": timestamps,
                "confidence": 0.9
            }
            
        except Exception as e:
            print(f"Error calling OpenAI: {str(e)}")
            raise

    
    def _format_transcript(
        self, 
        transcript: Union[Dict[str, Union[str, List[TranscriptSegment]]], Dict[str, str]]
    ) -> str:
        """Format transcript entries with timestamps
        
        Args:
            transcript: Dictionary containing transcript data in various formats
            
        Returns:
            Formatted transcript string with timestamps
        """
        formatted = []
        
        # if it's a dictionary with 'segments' key
        if 'segments' in transcript:
            for segment in transcript['segments']:
                try:
                    # segment is a dictionary?
                    if not isinstance(segment, dict):
                        continue
                    
                    # timestamp conversion
                    timestamp = segment.get('start', 0)
                    minutes = int(timestamp // 60)
                    seconds = int(timestamp % 60)
                    
                    timestamp_str = f"{minutes}:{seconds:02d}"
                    text = segment.get('text', '')
                    
                    formatted.append(f"[{timestamp_str}] {text}")
                
                except Exception as e:
                    print(f"Error processing segment: {e}")
                    continue
        
        # when it is flat dictionary with string values
        elif all(isinstance(key, str) and isinstance(val, str) for key, val in transcript.items()):
            for key, text in transcript.items():
                
                try:
                    timestamp = float(key) if key.replace('.', '').isdigit() else 0
                    minutes = int(timestamp // 60)
                    seconds = int(timestamp % 60)
                    
                    timestamp_str = f"{minutes}:{seconds:02d}"
                    formatted.append(f"[{timestamp_str}] {text}")
                
                except Exception as e:
                    print(f"Error processing entry: {e}")
                    continue
        
        return "\n".join(formatted)
        
    def _extract_timestamps(
        self, 
        response: str, 
        transcript: Union[Dict[str, Union[str, List[TranscriptSegment]]], Dict[str, str]]
    ) -> List[float]:
        """Extract relevant timestamps from the response
        
        Args:
            response: The AI response text
            transcript: The transcript data
            
        Returns:
            Sorted list of relevant timestamps
        """
        timestamps = set()  
        response_lower = response.lower()
        
        def process_text_and_timestamp(text: str, timestamp: float):

            phrases = text.lower().split('.')
            phrases.extend(text.lower().split(','))
            
            phrases.append(text.lower())
            
            phrases = [p.strip() for p in phrases if len(p.strip()) > 10] 
            
            for phrase in phrases:
                
                # get overlap at least 70% match
                if (phrase in response_lower or 
                    any(self._calculate_similarity(phrase, sent) > 0.7 
                        for sent in response_lower.split('.'))):
                    timestamps.add(timestamp)
                    break
        
        # handle transcript with 'segments' structure
        if 'segments' in transcript:
            for segment in transcript['segments']:
                try:
                    text = segment.get('text', '')
                    timestamp = segment.get('start', 0)
                    process_text_and_timestamp(text, timestamp)
                except Exception as e:
                    print(f"Error processing segment: {e}")
                    continue
        
        # when it is flat dictionary with string values
        elif isinstance(transcript, dict):
            for text_or_key, value in transcript.items():
                try:

                    if isinstance(value, str):
                        text = value
                        try:
                            timestamp = float(text_or_key)
                        except ValueError:
                            timestamp = 0
                    else:
                        text = value.get('text', '')
                        timestamp = value.get('timestamp', value.get('start', 0))
                    
                    process_text_and_timestamp(text, timestamp)
                except Exception as e:
                    print(f"Error processing entry: {e}")
                    continue
        
        timestamp_mentions = self._extract_timestamp_mentions(response)
        timestamps.update(timestamp_mentions)
        
        return sorted(list(timestamps))

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two text strings
        
        Args:
            text1: First text string
            text2: Second text string
            
        Returns:
            Similarity score between 0 and 1
        """
        
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        # do Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0

    def _extract_timestamp_mentions(self, text: str) -> Set[float]:
        """Extract timestamps mentioned in the response text
        
        Args:
            text: The response text to search for timestamps
            
        Returns:
            Set of timestamps found in the text
        """
        
        timestamps = set()
        
        # patterns like [1:23], (2:45), or just 1:23
        timestamp_pattern = r'[\[\(]?(\d{1,2}):(\d{2})[\]\)]?'
        
        matches = re.finditer(timestamp_pattern, text)
        for match in matches:
            minutes = int(match.group(1))
            seconds = int(match.group(2))
            timestamp = minutes * 60 + seconds
            timestamps.add(timestamp)
        
        return timestamps