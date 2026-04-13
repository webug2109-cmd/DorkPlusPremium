import re
from typing import List, Dict, Set
from collections import Counter
import aiohttp
from bs4 import BeautifulSoup

class KeywordExtractor:
    """Extract security-relevant keywords from text or URLs"""
    
    # Security-relevant keywords to prioritize
    SECURITY_KEYWORDS = {
        'login', 'admin', 'password', 'user', 'dashboard', 'config', 'database',
        'api', 'token', 'secret', 'backup', 'upload', 'download', 'file', 'data',
        'auth', 'session', 'cookie', 'key', 'credential', 'username', 'email',
        'account', 'profile', 'settings', 'security', 'private', 'confidential',
        'internal', 'customer', 'payment', 'card', 'ssn', 'personal', 'access',
        'permission', 'role', 'privilege', 'root', 'administrator', 'sudo',
        'mysql', 'postgres', 'mongodb', 'redis', 'sql', 'query', 'table',
        'insert', 'update', 'delete', 'select', 'drop', 'alter', 'create'
    }
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text"""
        # Remove special characters and extra whitespace
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.lower().strip()
    
    @staticmethod
    def extract_from_text(text: str, min_length: int = 3, max_keywords: int = 50) -> List[str]:
        """Extract keywords from plain text"""
        cleaned = KeywordExtractor.clean_text(text)
        words = cleaned.split()
        
        # Filter words
        filtered_words = [
            word for word in words 
            if len(word) >= min_length and not word.isdigit()
        ]
        
        # Count word frequency
        word_freq = Counter(filtered_words)
        
        # Prioritize security keywords
        keywords = []
        for word in KeywordExtractor.SECURITY_KEYWORDS:
            if word in word_freq:
                keywords.append(word)
        
        # Add other frequent words
        for word, count in word_freq.most_common(max_keywords):
            if word not in keywords:
                keywords.append(word)
                if len(keywords) >= max_keywords:
                    break
        
        return keywords[:max_keywords]
    
    @staticmethod
    async def extract_from_url(url: str, max_keywords: int = 50) -> List[str]:
        """Extract keywords from a URL's content"""
        try:
            timeout = aiohttp.ClientTimeout(total=10)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(url, ssl=False) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'lxml')
                        
                        # Remove script and style elements
                        for script in soup(["script", "style"]):
                            script.decompose()
                        
                        # Get text content
                        text = soup.get_text()
                        
                        # Extract keywords
                        return KeywordExtractor.extract_from_text(text, max_keywords=max_keywords)
                    else:
                        return []
        except Exception as e:
            print(f"Error extracting keywords from URL: {e}")
            return []
    
    @staticmethod
    def extract_parameters_from_url(url: str) -> List[str]:
        """Extract parameter names from URL"""
        params = re.findall(r'[?&]([^=&]+)=', url)
        return list(set(params))
