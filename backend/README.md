# Video Processing and Analysis Backend

A Django-based backend service for video processing, transcription, and interactive chat analysis. This service provides real-time video streaming, automatic transcription, and AI-powered chat capabilities for video content analysis.

## Features

- 🎥 Video Upload and Processing
  - Supports MP4, MOV, and AVI formats
  - Automatic thumbnail generation
  - File size validation (max 100MB)
  - Video duration checks (max 3 minutes)

- 📝 Automatic Transcription
  - Uses Whisper model for accurate transcription
  - Generates searchable transcript segments
  - Includes timestamp information

- 🤖 AI-Powered Chat Bot
  - OpenAI integration for intelligent video content analysis
  - Context-aware responses based on video transcripts
  - Semantic search capabilities

- 🔄 Real-time Streaming
  - Supports range requests for efficient streaming
  - Built-in caching mechanism
  - WebSocket-based chat interface

## Technical Stack

- **Framework**: Django
- **WebSocket**: Django Channels
- **AI Models**:
  - OpenAI GPT-3.5 for chat analysis
  - Whisper for transcription
  - Sentence Transformers for semantic search
- **Video Processing**: OpenCV, MoviePy
- **Cache**: Django's cache framework
- **File Processing**: python-magic for MIME validation


## API Documentation

### Video Management

#### REST Endpoints
- `POST /api/videos/upload` - Upload a new video
- `GET /api/videos` - List all videos
- `GET /api/videos/<video_id>` - Stream video content
- `DELETE /api/videos/<video_id>` - Delete a video
- `GET /api/videos/<video_id>/thumbnail` - Get video thumbnail
- `GET /api/videos/<video_id>/status` - Get processing status



### Chat Interface
  - Supports real-time chat interaction with video content
  - Provides AI-powered responses based on video context

  - #### Websocket Endpoint
    - WebSocket Endpoint: `ws://domain/ws/chat/<video_id>`


## Architecture Overview

### Backend Architecture

#### Django Apps

- `videos`: Video processing and management
- `chat`: WebSocket chat handling

#### Services

- `VideoService`: Video processing pipeline
- `TranscriptService`: AI transcription
- `OpenAIService`: Chat integration
- `CacheService`: Data caching

#### Core Components

- WebSocket consumers for real-time chat
- Video processing pipeline
- Search implementation
- File validation system

### Data Flow

1. Video Upload → Processing → Transcription
2. Search Query → NLP Analysis → Semantic Search
3. Chat Message → AI Processing → Real-time Response

## Directory Structure

```
project_root/
├── apps/                    # Django applications
│   ├── __init__.py
│   ├── chat/               # Chat application
│   │   ├── __init__.py
│   │   ├── apps.py        # Chat app configuration
│   │   ├── consumers.py   # WebSocket consumers
│   │   └── routing.py     # WebSocket routing
│   └── videos/            # Videos application
│       ├── __init__.py
│       ├── apps.py        # Videos app configuration
│       ├── urls.py        # Video endpoints routing
│       └── views.py       # Video handling views
├── core/                   # Project core settings
│   ├── __init__.py
│   ├── asgi.py            # ASGI configuration
│   ├── settings.py        # Project settings
│   ├── urls.py            # Main URL routing
│   └── wsgi.py            # WSGI configuration
├── services/              # Business logic services
│   ├── video_service.py   # Video processing and management
│   ├── transcript_service.py  # Transcription handling
│   ├── openai_service.py  # AI chat integration
│   └── cache_service.py   # Caching utilities
├── utils/                 # Utility functions
│   └── validators.py      # File validation utilities
└── media/                 # Media file storage
    └── videos/           # Video file storage
```

## Configuration

### Video Processing
- Maximum file size: 100MB
- Supported formats: MP4, MOV, AVI
- Maximum duration: 3 minutes

### Caching
- Default cache timeout: 24 hours
- Cached items:
  - Video metadata
  - Transcripts
  - Chat context


## License

[MIT License](LICENSE)
