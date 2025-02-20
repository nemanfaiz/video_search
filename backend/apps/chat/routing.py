from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/videos/chat/(?P<video_id>[^/]+)", consumers.VideoChatConsumer.as_asgi()),
]
