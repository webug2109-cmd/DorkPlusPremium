import re
import hashlib
from typing import Dict, Optional

class HashIdentifier:
    """Identify hash types"""
    
    HASH_PATTERNS = {
        'MD5': (r'^[a-f0-9]{32}$', 32),
        'SHA1': (r'^[a-f0-9]{40}$', 40),
        'SHA256': (r'^[a-f0-9]{64}$', 64),
        'SHA512': (r'^[a-f0-9]{128}$', 128),
        'bcrypt': (r'^\$2[aby]?\$\d{2}\$.{53}$', None),
        'NTLM': (r'^[a-f0-9]{32}$', 32),
        'MySQL5': (r'^\*[a-f0-9]{40}$', 41),
        'Base64': (r'^[A-Za-z0-9+/]+={0,2}$', None),
    }
    
    @staticmethod
    def identify(hash_string: str) -> list:
        """Identify possible hash types"""
        hash_string = hash_string.strip()
        possible_types = []
        
        for hash_type, (pattern, length) in HashIdentifier.HASH_PATTERNS.items():
            if length and len(hash_string) != length:
                continue
            if re.match(pattern, hash_string, re.IGNORECASE):
                possible_types.append(hash_type)
        
        return possible_types if possible_types else ['Unknown']
    
    @staticmethod
    def hash_text(text: str, algorithm: str = 'md5') -> str:
        """Hash text with specified algorithm"""
        algorithms = {
            'md5': hashlib.md5,
            'sha1': hashlib.sha1,
            'sha256': hashlib.sha256,
            'sha512': hashlib.sha512
        }
        
        if algorithm.lower() not in algorithms:
            raise ValueError(f"Unsupported algorithm. Use: {list(algorithms.keys())}")
        
        return algorithms[algorithm.lower()](text.encode()).hexdigest()

class EncoderDecoder:
    """Encode and decode various formats"""
    
    @staticmethod
    def base64_encode(text: str) -> str:
        """Encode to base64"""
        import base64
        return base64.b64encode(text.encode()).decode()
    
    @staticmethod
    def base64_decode(encoded: str) -> str:
        """Decode from base64"""
        import base64
        try:
            return base64.b64decode(encoded).decode()
        except:
            return "Invalid base64 string"
    
    @staticmethod
    def url_encode(text: str) -> str:
        """URL encode"""
        from urllib.parse import quote
        return quote(text)
    
    @staticmethod
    def url_decode(encoded: str) -> str:
        """URL decode"""
        from urllib.parse import unquote
        return unquote(encoded)
    
    @staticmethod
    def hex_encode(text: str) -> str:
        """Encode to hex"""
        return text.encode().hex()
    
    @staticmethod
    def hex_decode(encoded: str) -> str:
        """Decode from hex"""
        try:
            return bytes.fromhex(encoded).decode()
        except:
            return "Invalid hex string"

class UserAgentGenerator:
    """Generate random user agents"""
    
    USER_AGENTS = [
        # Chrome on Windows
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        # Firefox on Windows
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        # Safari on macOS
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        # Edge on Windows
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        # Chrome on Linux
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        # Mobile - iPhone
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        # Mobile - Android
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
    ]
    
    @staticmethod
    def get_random() -> str:
        """Get a random user agent"""
        import random
        return random.choice(UserAgentGenerator.USER_AGENTS)
    
    @staticmethod
    def get_all() -> list:
        """Get all user agents"""
        return UserAgentGenerator.USER_AGENTS
