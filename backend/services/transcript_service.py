from typing import Dict, Optional, List, Set, Union, TypedDict, Any, Mapping
import whisper
import spacy
from spacy.tokens import Doc, Token
from sentence_transformers import SentenceTransformer
import numpy as np
from numpy.typing import NDArray
from sklearn.metrics.pairwise import cosine_similarity

class TranscriptSegment(TypedDict):
    """Type definition for a transcript segment"""
    text: str
    start: float
    embedding: List[float]

class TranscriptResult(TypedDict):
    """Type definition for transcript generation result"""
    text: str
    segments: List[TranscriptSegment]
    success: bool
    error: Optional[str]

class SearchMatch(TypedDict):
    """Type definition for search result match"""
    timestamp: float
    text: str
    confidence: float
    question_type: Optional[str]

class QuestionComponents(TypedDict):
    """Type definition for extracted question components"""
    question_type: Optional[str]
    subject: List[str]
    action: Optional[str]
    context: List[str]
    
class TranscriptService:
    def __init__(self):
        
        self.whisper_model: whisper.Whisper = whisper.load_model("base")
        self.nlp: spacy.language.Language = spacy.load("en_core_web_sm")
        self.semantic_model: SentenceTransformer = SentenceTransformer('all-MiniLM-L6-v2')
        
        
        # question patterns and their focus words
        self.question_patterns = {
            'when': ['time', 'moment', 'during', 'at'],
            'where': ['location', 'place', 'area', 'in'],
            'who': ['person', 'people', 'team', 'by'],
            'what': ['thing', 'feature', 'product', 'about'],
            'how': ['way', 'method', 'process', 'steps'],
            'why': ['reason', 'cause', 'because', 'purpose']
        }
        
    async def generate_transcript(self, video_path: str) -> TranscriptResult:
        """Generate transcript from video file with enhanced segment processing
        
        Args:
            video_path: Path to the video file
            
        Returns:
            Dictionary containing transcript text, segments, and status
        """
        try:
            result = self.whisper_model.transcribe(video_path)
            
            enhanced_segments = []
            for segment in result['segments']:
                
                # generate embedding and convert to numpy array for serialization
                embedding = self.semantic_model.encode(segment['text'])  
                
                segment['embedding'] = embedding.tolist()  
                enhanced_segments.append(segment)
            
            return {
                'text': result['text'],
                'segments': enhanced_segments,
                'success': True
            }
        except Exception as e:
            print(f"Transcript generation error: {e}")
            return {
                'text': '',
                'segments': [],
                'success': False,
                'error': str(e)
            }

    def _extract_question_components(self, query: str) -> QuestionComponents:
        """Extract key components from a question for better matching
        
        Args:
            query: User's question
            
        Returns:
            Dictionary containing question type and components
        """
        
        doc = self.nlp(query.lower())
        
        components = {
            'question_type': None,
            'subject': [],
            'action': None,
            'context': []
        }
        
        first_word = doc[0].text.lower()
        if first_word in self.question_patterns:
            components['question_type'] = first_word
        
        for token in doc:
            if token.dep_ in ('nsubj', 'dobj', 'pobj') and token.pos_ in ('NOUN', 'PROPN'):
                components['subject'].append(token.text)
            
            elif token.pos_ == 'VERB' and not token.is_stop:
                if not components['action']:
                    components['action'] = token.text
            
            elif (token.pos_ in ('NOUN', 'PROPN', 'ADJ') and 
                  not token.is_stop and 
                  token.text not in components['subject']):
                
                components['context'].append(token.text)
        
        return components

    def _augment_query(self, components: QuestionComponents) -> str:
        """Augment the query with relevant context based on question type
        
        Args:
            components: Extracted question components
            
        Returns:
            Augmented query string
        """
        query_parts = []
        
        if components['question_type'] in self.question_patterns:
            query_parts.extend(self.question_patterns[components['question_type']])
        
        query_parts.extend(components['subject'])
        
        if components['action']:
            query_parts.append(components['action'])
        
        query_parts.extend(components['context'])
        
        return ' '.join(set(query_parts))


    async def search_transcript(
        self, 
        query: str, 
        transcript: Dict[str, Any]
    ) -> List[SearchMatch]:
        """Search transcript for relevant content
        
        Args:
            query: User's search query
            transcript: Video transcript data
            
        Returns:
            List of matching segments with timestamps and confidence scores
        """
        try:
            segments = transcript.get('segments', [])
            if not segments:
                return []

            question_components = self._extract_question_components(query)
            augmented_query = self._augment_query(question_components)
            
            # generate query embedding as numpy array
            query_embedding = self.semantic_model.encode(augmented_query)
            
            matches = []
            for segment in segments:
                segment_embedding = np.array(segment['embedding'])
                
                # calculate similarity
                similarity = cosine_similarity(
                    query_embedding.reshape(1, -1),
                    segment_embedding.reshape(1, -1)
                )[0][0]
                
                # segment contains question-relevant words then increase score
                segment_doc = self.nlp(segment['text'].lower())
                segment_words = {token.text for token in segment_doc}
                
                if question_components['question_type'] in self.question_patterns:
                    focus_words = self.question_patterns[question_components['question_type']]
                    
                    if any(word in segment_words for word in focus_words):
                        similarity *= 1.2
                
                if similarity > 0.3:
                    matches.append({
                        'timestamp': segment['start'],
                        'text': segment['text'],
                        'confidence': float(similarity),
                        'question_type': question_components['question_type']
                    })
            
            sorted_matches = sorted(matches, key=lambda x: x['confidence'], reverse=True)
            return sorted_matches[:3]

        except Exception as e:
            print(f"Transcript search error: {e}")
            return []