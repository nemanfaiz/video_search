from django.urls import path
from . import views

app_name = 'videos'

urlpatterns = [
    path('upload', views.upload_video, name='upload_video'),
    path('get', views.get_videos, name='get_videos'),
    path('search', views.search_video, name='search_video'),
    path('stream/<str:video_id>', views.stream_video, name='stream_video'),
    path('status/<str:video_id>', views.get_processing_status, name='video_status'),
    path('delete/<str:video_id>', views.delete_video, name='delete_video'),
    path('thumbnail/<str:video_id>', views.get_thumbnail, name='get_thumbnail'),
]