from datetime import datetime
import os
from typing import List, Dict, Optional, TypedDict
from moviepy.editor import VideoFileClip
from django.conf import settings

class VideoMetadata(TypedDict):
    """Type definition for video metadata"""
    video_id: str
    original_filename: str
    title: str
    file_size: int
    duration: float
    width: int
    height: int
    created_at: str
    processing_status: str

class VideoFileManager:
    VALID_VIDEO_EXTENSIONS: tuple[str, ...] = ('.mp4', '.mov', '.avi')

    @staticmethod
    async def read_all_videos(limit: Optional[int] = None) -> List[VideoMetadata]:
        """Read metadata for all videos in the media directory
        
        Args:
            limit: Optional maximum number of videos to return
            
        Returns:
            List of video information dictionaries sorted by creation date
            
        Note:
            Videos are sorted by created_at in descending order (newest first)
        """
        
        videos = []
        videos_dir = os.path.join(settings.MEDIA_ROOT, 'videos')
        
        if not os.path.exists(videos_dir):
            return []
            
        # look through all UUID directories
        for video_id in os.listdir(videos_dir):
            video_dir = os.path.join(videos_dir, video_id)
            
            if not os.path.isdir(video_dir):
                continue
                
            # find video file in directory
            video_files = [f for f in os.listdir(video_dir) 
                         if f.endswith(VideoFileManager.VALID_VIDEO_EXTENSIONS) 
                         and not f.startswith('.')]
                         
            if not video_files:
                continue
                
            video_file = video_files[0] 
            video_path = os.path.join(video_dir, video_file)
            
            try:
                stats = os.stat(video_path)
                
                # get video metadata using moviepy
                clip = VideoFileClip(video_path)

                video_info = {
                    'video_id': video_id,
                    'original_filename': video_file,
                    'title': os.path.splitext(video_file)[0],
                    'file_size': stats.st_size,
                    'duration': clip.duration,
                    'width': clip.w,
                    'height': clip.h,
                    'created_at': datetime.fromtimestamp(stats.st_ctime).isoformat(),
                    'processing_status': 'completed'
                }
                
                clip.close()
                videos.append(video_info)
                
            except Exception as e:
                print(f"Error reading video metadata for {video_path}: {str(e)}")
                continue
        
        # Sort by created_at descending
        videos.sort(key=lambda x: x['created_at'])
        
        if limit and limit > 0:
            videos = videos[:limit]
            
        return videos