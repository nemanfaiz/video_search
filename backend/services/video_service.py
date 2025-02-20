from .cache_service import CacheService
from .transcript_service import TranscriptService
from typing import Dict, Optional, List, Tuple, TypedDict, Any, Union
from datetime import datetime
import os
from moviepy.editor import VideoFileClip
from django.conf import settings
from PIL import Image
import cv2
import numpy as np
from .video_file_manager import VideoFileManager

class VideoFileInfo(TypedDict):
    """Type definition for video file information"""
    file_path: str
    file_size: int
    content_type: str
    metadata: Dict[str, Any]
    filename: str

class VideoMetadata(TypedDict):
    """Type definition for video metadata"""
    video_id: str
    original_filename: str
    file_size: int
    duration: float
    width: int
    height: int
    created_at: str
    transcript: Dict[str, Any]
    processing_status: str
    thumbnail: str

class ProcessingStatus(TypedDict):
    """Type definition for processing status response"""
    success: bool
    video_id: str
    status: str
    progress: int

class ProcessingResult(TypedDict, total=False):
    """Type definition for processing result"""
    success: bool
    error: Optional[str]
    video_id: Optional[str]
    original_filename: Optional[str]
    file_size: Optional[int]
    duration: Optional[float]
    width: Optional[int]
    height: Optional[int]
    created_at: Optional[str]
    transcript: Optional[Dict[str, Any]]
    processing_status: Optional[str]
    thumbnail: Optional[str]

class DeleteResult(TypedDict):
    """Type definition for delete operation result"""
    success: bool
    message: Optional[str]
    error: Optional[str]

class VideoService:
    def __init__(self):
        self.cache_service: CacheService = CacheService()
        self.transcript_service: TranscriptService = TranscriptService()
        self.video_file_manager: VideoFileManager = VideoFileManager()
        self.video_cache: Dict[str, Dict[str, Any]] = {}


    async def get_video_file_info(self, video_id: str) -> Optional[VideoFileInfo]:
        """Get video file info from temp directory structure
        
        Args:
            video_id: ID of the video to retrieve
            
        Returns:
            Dictionary containing file information or None if not found
        """
        try:
            video_info = await self.get_video_info(video_id)

            if not video_info:
                return None

            temp_dir = os.path.join(settings.MEDIA_ROOT, 'videos', video_id)
            if not os.path.exists(temp_dir):
                return None

            video_files = [f for f in os.listdir(temp_dir) if f.endswith(('.mp4', '.mov', '.avi'))]
            if not video_files:
                return None

            file_path = os.path.join(temp_dir, video_files[0])
            
            return {
                'file_path': file_path,
                'file_size': os.path.getsize(file_path),
                'content_type': 'video/mp4', 
                'metadata': video_info,
                'filename': video_files[0]
            }
            
        except Exception as e:
            print(f"Error getting video file info: {str(e)}")
            return None

    async def handle_video_range_request(
        self, 
        file_path: str,
        file_size: int,
        range_header: str
    ) -> Tuple[int, int, int]:
        """Handle range header for video streaming
        
        Args:
            file_path: Path to video file
            file_size: Size of video file
            range_header: HTTP range header
            
        Returns:
            Tuple of (first_byte, last_byte, length)
        """
        try:
            first_byte = 0
            last_byte = file_size - 1
            length = file_size
            
            if range_header:
                range_match = range_header.strip().replace('bytes=', '').split('-')
                
                if len(range_match) == 2:
                    first_byte = int(range_match[0]) if range_match[0] else 0
                    last_byte = int(range_match[1]) if range_match[1] else file_size - 1
                    length = last_byte - first_byte + 1
                    
            return first_byte, last_byte, length
            
        except Exception as e:
            print(f"Error handling range request: {str(e)}")
            return 0, file_size - 1, file_size
        
    async def get_all_videos(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all videos from cache
        
        Args:
            limit: Optional maximum number of videos to return
            
        Returns:
            List of video information dictionaries
        """
        try:
            videos = await self.video_file_manager.read_all_videos(limit)
            
            for video in videos:
                try:
                    cached_info = await self.cache_service.get(f"video_{video['video_id']}")
                    
                    if cached_info:
                        video.update({
                            'transcript': cached_info.get('transcript'),
                            'thumbnail': cached_info.get('thumbnail')
                        })
                
                except Exception as e:
                    print(f"Error getting cache info for video {video['video_id']}: {str(e)}")
                    continue
            
            sorted_videos = sorted(
                videos,
                key=lambda x: x.get('created_at', ''),
                reverse=True
            )
            
            if limit and limit > 0:
                sorted_videos = sorted_videos[:limit]

            return sorted_videos
        
        except Exception as e:
            print(f"Error getting all videos: {str(e)}")
            return []
    
    async def process_video(
        self, 
        file_path: str, 
        video_id: str, 
        original_filename: str
    ) -> ProcessingResult:
        """Process uploaded video file
        
        Args:
            file_path: Path to video file
            video_id: Unique identifier for video
            original_filename: Original name of uploaded file
            
        Returns:
            Dictionary containing processing results and metadata
        """
        try:
            file_size = os.path.getsize(file_path)
            
            # get video duration and metadata
            clip = VideoFileClip(file_path)
            duration = clip.duration
            width = clip.w
            height = clip.h
            clip.close()

             # 3 minutes
            if duration > 180: 
                return {
                    'success': False,
                    'error': 'Video must be 3 minutes or shorter'
                }

            # generate transcript
            transcript = await self.transcript_service.generate_transcript(file_path)
            if not transcript['success']:
                return transcript

            # generate thumbnail
            thumbnail_path = os.path.join(settings.MEDIA_ROOT, 'videos', video_id, 'thumbnail.jpg')
            cap = cv2.VideoCapture(file_path)
            
            # get total frames and set it to middle
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            middle_frame = total_frames // 2
            cap.set(cv2.CAP_PROP_POS_FRAMES, middle_frame)
        
            ret, frame = cap.read()
            if ret:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                cv2.imwrite(thumbnail_path, frame)
            
            cap.release()
            
            # metadata
            metadata = {
                'video_id': video_id,
                'original_filename': original_filename,
                'file_size': file_size,
                'duration': duration,
                'width': width,
                'height': height,
                'created_at': datetime.utcnow().isoformat(),
                'transcript': transcript,
                'processing_status': 'completed',
                'thumbnail': thumbnail_path
            }

            await self.cache_service.set(f"video_{video_id}", metadata)

            return {
                'success': True,
                **metadata
            }

        except Exception as e:
            print(f"Video processing error: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def get_video_info(self, video_id: str) -> Optional[Dict[str, Any]]:
        """Get video information from cache
        
        Args:
            video_id: ID of the video to retrieve
            
        Returns:
            Video information dictionary or None if not found
        """
        return await self.cache_service.get(f"video_{video_id}")
    


    async def get_processing_status(self, video_id: str) -> ProcessingStatus:
        """Get video processing status
        
        Args:
            video_id: ID of the video to check
            
        Returns:
            Dictionary containing processing status information
        """
        
        video_info = await self.get_video_info(video_id)
        if not video_info:
            return {
                'success': False,
                'error': 'Video not found'
            }
        
        return {
            'success': True,
            'video_id': video_id,
            'status': video_info.get('processing_status', 'unknown'),
            'progress': video_info.get('processing_progress', 0)
        }
    
    async def delete_video(self, video_id: str) -> DeleteResult:
        """Delete a video and its associated data
        
        Args:
            video_id: ID of the video to delete
            
        Returns:
            Dictionary indicating success or failure of deletion
        """
        try:
            video_info = await self.get_video_info(video_id)
            if not video_info:
                return {
                    'success': False,
                    'error': 'Video not found'
                }

            # delete the physical file
            temp_dir = os.path.join(settings.MEDIA_ROOT, 'videos', video_id)
            
            if os.path.exists(temp_dir):
            
                # delete all files in directory
                for file in os.listdir(temp_dir):
                    os.remove(os.path.join(temp_dir, file))
                
                # remove the directory itself
                os.rmdir(temp_dir)

            # delete from cache
            await self.cache_service.delete(f"video_{video_id}")

            return {
                'success': True,
                'message': 'Video deleted successfully'
            }

        except Exception as e:
            print(f"Error deleting video: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }