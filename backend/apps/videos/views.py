from django.http import JsonResponse, HttpResponse, StreamingHttpResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.http.request import HttpRequest
import uuid
import json
from services.video_service import VideoService
import os
from django.conf import settings
from utils.validators import validate_video_file
from wsgiref.util import FileWrapper
from typing import Tuple, Dict, Any, List, Optional, Union, BinaryIO


video_service = VideoService()

@csrf_exempt
async def upload_video(request: HttpRequest) -> JsonResponse:
    """Handle video upload
    
    Args:
        request: HTTP request object with video file
        
    Returns:
        JSON response with video metadata or error
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        video_file = request.FILES.get('video')
        video_title = request.POST.get('title', '')
        
        
        if video_title == "":
            video_title = video_file.name
        if not video_title.endswith('.mp4'):
            video_title += '.mp4'
            
        if not video_file:
            return JsonResponse({'error': 'No video file provided'}, status=400)

        # validate file
        is_valid, error_message = validate_video_file(video_file)
        if not is_valid:
            return JsonResponse({'error': error_message}, status=400)

        video_id = str(uuid.uuid4())
        
        videos_dir = os.path.join(settings.MEDIA_ROOT, 'videos')
        if not os.path.exists(videos_dir):
            os.makedirs(videos_dir)
        
        # store file 
        file_path = default_storage.save(
            f'videos/{video_id}/{video_title}', 
            ContentFile(video_file.read())
        )
        
        abs_file_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        # process video
        result = await video_service.process_video(
            abs_file_path, 
            video_id,
            original_filename=video_title
        )
        
        if not result['success']:
            # clean up if processing failed
            default_storage.delete(file_path)
            return JsonResponse({'error': result['error']}, status=400)

        return JsonResponse({
            'video_id': result['video_id'],
            'duration': result['duration'],
            'file_size': result['file_size'],
            'width': result['width'],
            'height': result['height'],
            'created_at': result['created_at'],
            'processing_status': result['processing_status']
        })

    except Exception as e:
        print(f"Upload error: {str(e)}")
        return JsonResponse({
            'error': 'An unexpected error occurred while processing the video'
        }, status=500)

@csrf_exempt
async def get_videos(request: HttpRequest) -> JsonResponse:
    """Get all videos
    
    Args:
        request: HTTP request object with optional limit parameter
        
    Returns:
        JSON response with list of videos or error
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        # get query params if any
        limit = request.GET.get('limit')
        print("type of limit ", type(limit))
        limit = int(limit) if limit and limit.isdigit() else None
        
        # get all video IDs
        videos = await video_service.get_all_videos(limit=limit)
        if not videos:
            return JsonResponse({'videos': []})

        # format the response to match frontend 
        formatted_videos = [{
            'video_id': video['video_id'],
            'title': video.get('original_filename', '').split('.')[0], 
            'duration': video['duration'],
            'file_size': video['file_size'],
            'width': video['width'],
            'height': video['height'],
            'created_at': video['created_at'],
            'processing_status': video['processing_status']
        } for video in videos]

        return JsonResponse({'videos': formatted_videos})

    except Exception as e:
        print(f"Error fetching videos: {str(e)}")
        return JsonResponse({
            'error': 'An unexpected error occurred while fetching videos'
        }, status=500)

@csrf_exempt
async def stream_video(request: HttpRequest, video_id: str) -> Union[StreamingHttpResponse, HttpResponse]:
    """Stream video file with range request support
    
    Args:
        request: HTTP request object
        video_id: ID of the video to stream
        
    Returns:
        Streaming response with video data or error response
    """
    if request.method != 'GET':
        return HttpResponse('Method not allowed', status=405)
        
    try:
        video_info = await video_service.get_video_file_info(video_id)
        if not video_info:
            return HttpResponse('Video not found', status=404)
        
        file_path = video_info['file_path']
        file_size = video_info['file_size']
        content_type = video_info['content_type']
        
        file_obj = open(file_path, 'rb')
        
        # handle range header
        range_header = request.META.get('HTTP_RANGE', '')
        
        if range_header:
            bytes_range = range_header.replace('bytes=', '').split('-')
            start_byte = int(bytes_range[0])
            end_byte = int(bytes_range[1]) if bytes_range[1] else file_size - 1
            
            if start_byte >= file_size:
                return HttpResponse(
                    'Requested range not satisfiable',
                    status=416,
                    headers={'Content-Range': f'bytes */{file_size}'}
                )
                
            chunk_size = end_byte - start_byte + 1
            file_obj.seek(start_byte)
            
            response = StreamingHttpResponse(
                FileWrapper(file_obj, chunk_size),
                status=206,
                content_type=content_type
            )
            
            response['Content-Length'] = str(chunk_size)
            response['Content-Range'] = f'bytes {start_byte}-{end_byte}/{file_size}'
            response['Accept-Ranges'] = 'bytes'
            
        else:
            response = StreamingHttpResponse(
                FileWrapper(file_obj),
                content_type=content_type
            )
            response['Content-Length'] = str(file_size)
            response['Accept-Ranges'] = 'bytes'
        
        # headers for streaming
        response['Cache-Control'] = 'no-cache'
        filename = video_info['filename']
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        
        return response
            
    except Exception as e:
        print(f"Streaming error: {str(e)}")
        if 'file_obj' in locals():
            file_obj.close()
        return HttpResponse('Error streaming video', status=500)

@csrf_exempt
async def search_video(request: HttpRequest) -> JsonResponse:
    """Search video transcript
    
    Args:
        request: HTTP request object with video_id and query
        
    Returns:
        JSON response with search results or error
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        video_id = data.get('video_id')
        query = data.get('query')

        if not video_id or not query:
            return JsonResponse({
                'error': 'video_id and query are required'
            }, status=400)

        video_info = await video_service.get_video_info(video_id)
        if not video_info:
            return JsonResponse({'error': 'Video not found'}, status=404)

        result = await video_service.transcript_service.search_transcript(
            query, 
            video_info['transcript']
        )
        print("result is here", result)

        if not result:
            return JsonResponse({
                'message': "No relevant content found"
            })

        return JsonResponse({
            'results': result,
            'count': len(result)
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@csrf_exempt
async def delete_video(request: HttpRequest, video_id: str) -> JsonResponse:
    """Delete a video and its associated data
    
    Args:
        request: HTTP request object
        video_id: ID of the video to delete
        
    Returns:
        JSON response indicating success or error
    """
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        result = await video_service.delete_video(video_id)
        
        if not result['success']:
            return JsonResponse({'error': result['error']}, status=404)

        return JsonResponse(result)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
    
@csrf_exempt
async def get_thumbnail(request: HttpRequest, video_id: str) -> Union[FileResponse, HttpResponse]:
    """Get video thumbnail
    
    Args:
        request: HTTP request object
        video_id: ID of the video
        
    Returns:
        File response with thumbnail or error response
    """
    if request.method != 'GET':
        return HttpResponse('Method not allowed', status=405)
        
    try:
        video_info = await video_service.get_video_file_info(video_id)
        if not video_info:
            return HttpResponse('Video not found', status=404)
            
        thumbnail_path = os.path.join(settings.MEDIA_ROOT, 'videos', video_id, 'thumbnail.jpg')
        if not os.path.exists(thumbnail_path):
            return HttpResponse('Thumbnail not found', status=404)
            
        return FileResponse(open(thumbnail_path, 'rb'), content_type='image/jpeg')
            
    except Exception as e:
        print(f"Error getting thumbnail: {str(e)}")
        return HttpResponse('Error getting thumbnail', status=500)


@csrf_exempt
async def get_processing_status(request: HttpRequest, video_id: str) -> JsonResponse:
    """Get video processing status
    
    Args:
        request: HTTP request object
        video_id: ID of the video to check
        
    Returns:
        JSON response with processing status or error
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        result = await video_service.get_processing_status(video_id)
        if not result['success']:
            return JsonResponse({'error': result['error']}, status=404)

        return JsonResponse(result)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

