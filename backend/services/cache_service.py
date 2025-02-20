from django.core.cache import cache
from typing import Any, Optional, List, Set, Union, Dict
import json

class CacheService:
    """Service for handling cache operations with type-safe methods"""
    
    CacheableValue = Union[str, int, float, bool, Dict[str, Any], List[Any], None]
    
    @staticmethod
    async def set(
        key: str, 
        value: CacheableValue, 
        timeout: int = 86400
    ) -> bool:
        """Set a value in cache
        
        Args:
            key: Cache key to store value under
            value: Value to store (must be JSON serializable)
            timeout: Cache timeout in seconds (default 24 hours)
            
        Returns:
            bool: True if successful, False if error occurred
        """
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)

            if key.startswith('video_'):
                all_keys = cache.get('all_video_keys', set())
                all_keys.add(key)
                cache.set('all_video_keys', all_keys)
                
            cache.set(key, value, timeout)
            return True
        
        except Exception as e:
            print(f"Cache set error: {e}")
            return False
    
    @staticmethod
    async def get(key: str) -> Optional[CacheableValue]:
        """Get a value from cache
        
        Args:
            key: Cache key to retrieve
            
        Returns:
            Optional[CacheableValue]: Retrieved value or None if not found/error
        """
        try:
            value = cache.get(key)
            
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            
            return value
        
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    @staticmethod
    async def delete(key: str) -> bool:
        """Delete a value from cache
        
        Args:
            key: Cache key to delete
            
        Returns:
            bool: True if successful, False if error occurred
        """
        try:
            if key.startswith('video_'):
                all_keys = cache.get('all_video_keys', set())
                all_keys.discard(key)
                cache.set('all_video_keys', all_keys)
            
            cache.delete(key)
            
            return True
        
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False

    @staticmethod
    async def keys(pattern: str) -> List[str]:
        """Get all keys matching pattern
        
        Args:
            pattern: Pattern to match keys against (currently only supports 'video_*')
            
        Returns:
            List[str]: List of matching cache keys
        """
        try:
            if pattern == 'video_*':
                all_keys = cache.get('all_video_keys', set())
                return list(all_keys)

            return []

        except Exception as e:
            print(f"Cache keys error: {e}")
            return []