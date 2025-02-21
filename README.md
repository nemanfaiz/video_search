# Getting Started

## Prerequisites

- Python 3.11+
- Node.js 22+
- OpenAI API key
- Redis (for caching and WebSocket)
- FFmpeg (for video processing)

### Installing FFmpeg
FFmpeg is a  multimedia framework for handling video, audio, and other multimedia files. It's used in this project for video processing and thumbnail generation.

On Mac (using Homebrew):
```bash
brew install ffmpeg
```

Verify installation:
```bash
ffmpeg -version
```

### Setting up Redis
Redis is used for caching and WebSocket message broadcasting.

On Mac (using Homebrew):
```bash
# Install Redis
brew install redis

# Start Redis server
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return "PONG"
```

To stop Redis:
```bash
brew services stop redis
```

### Backend Setup


1. Navigate to backend of video_search repo:
```bash
cd backend
# pwd = video_search/backend
```

2. Create and activate a virtual environment:
```bash
python -m venv .venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables in `.env`:
```env
DJANGO_SECRET_KEY='django-insecure-gby)e66p&k!2@u!qagztv#!mkfeg&r*i4v2jyi*-pnr-5jgoo+'
DEBUG=True
OPENAI_API_KEY=your_openai_api_key
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Start the development server:
```bash
uvicorn core.asgi:application --reload
```

### Frontend Setup

```bash
cd frontend
# pwd = video_search/frontend

npm install

npm run dev
```


## Tech Stack

### Frontend

- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- WebSocket Client
- Video.js Player

### Backend

- Django 4.2
- Django Channels
- Django REST Framework
- OpenAI GPT-3.5
- Whisper AI
- Sentence Transformers
- Spacy NLP
- Python-Magic for file validation

### AI & ML

- OpenAI API Integration
- Whisper Transcription
- Sentence Transformers
- Spacy NLP Pipeline


# Video Analysis Platform

A full-stack web application that enables video uploads, AI-powered transcription, natural language search within videos, and real-time chat interactions.

## Features

### Core Functionality

#### Video Upload & Processing

- Support for videos up to 3 minutes in length
- Automatic transcription using Whisper AI
- Thumbnail generation and preview
- Format validation (MP4, MOV, AVI)
- Background processing with status updates
- Progress tracking during upload

#### Natural Language Search

- Semantic search through video content
- AI-powered question understanding
- Timestamp-based results with confidence scores
- Direct navigation to relevant video segments
- Context-aware search ranking
- Spacy NLP for question analysis

#### AI Chat Interface

- WebSocket-based real-time chat
- GPT-3.5 powered responses
- Context-aware video content analysis
- Clickable timestamp references
- Real-time message updates
- Chat history preservation

### Technical Features

- Type-safe backend with Python type hints
- Efficient video streaming with range requests
- Real-time WebSocket communication
- Semantic search embeddings
- RESTful API endpoints
- Caching system for optimization

## Development Decisions

### Why Django + Channels?

- Robust WebSocket support
- Strong async capabilities
- Excellent ORM
- Type hint support

### Trade-offs Considered

#### Transcription Approach

- Chose Whisper AI for accuracy
- Trade-off: Processing time vs. accuracy

#### Search Implementation

- Used semantic search for better understanding
- Trade-off: Complexity vs. search quality

#### Real-time Features

- Implemented WebSockets for immediacy
- Trade-off: Connection maintenance vs. simplicity

## Future Improvements

### Performance

- Background task queue for processing
- Enhanced caching strategy
- Video chunk uploading
- WebSocket connection pooling

### Features

- Multi-language support
- Video analytics dashboard
- Advanced search filters
- User authentication

### Technical

- Docker containerization
- Comprehensive test suite
- Comprehensive API documentation
- CI/CD pipeline


## License

MIT