import asyncio
import aiohttp
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import List, Set, Dict
import time
import re

class WebCrawler:
    """Asynchronous web crawler for discovering endpoints"""
    
    def __init__(self, base_url: str, max_depth: int = 2, timeout: int = 10):
        self.base_url = base_url
        self.max_depth = max_depth
        self.timeout = timeout
        self.visited_urls: Set[str] = set()
        self.results: List[Dict] = []
        self.base_domain = urlparse(base_url).netloc
        
    def is_valid_url(self, url: str) -> bool:
        """Check if URL belongs to the same domain"""
        parsed = urlparse(url)
        return parsed.netloc == self.base_domain
    
    def clean_url(self, url: str) -> str:
        """Remove fragments and normalize URL"""
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}{parsed.path}{('?' + parsed.query) if parsed.query else ''}"
    
    async def fetch_url(self, session: aiohttp.ClientSession, url: str) -> Dict:
        """Fetch a single URL and extract information"""
        start_time = time.time()
        try:
            async with session.get(url, timeout=self.timeout, ssl=False) as response:
                response_time = time.time() - start_time
                content = await response.text()
                
                # Extract title
                soup = BeautifulSoup(content, 'lxml')
                title = soup.title.string if soup.title else 'No Title'
                
                return {
                    'url': url,
                    'status': response.status,
                    'title': title.strip() if title else 'No Title',
                    'contentType': response.headers.get('Content-Type', 'unknown'),
                    'responseTime': round(response_time, 2),
                    'links': self.extract_links(content, url) if response.status == 200 else []
                }
        except asyncio.TimeoutError:
            return {
                'url': url,
                'status': 408,
                'title': 'Request Timeout',
                'contentType': 'error',
                'responseTime': self.timeout,
                'links': []
            }
        except Exception as e:
            return {
                'url': url,
                'status': 0,
                'title': f'Error: {str(e)[:50]}',
                'contentType': 'error',
                'responseTime': time.time() - start_time,
                'links': []
            }
    
    def extract_links(self, html: str, base_url: str) -> List[str]:
        """Extract all links from HTML content"""
        soup = BeautifulSoup(html, 'lxml')
        links = set()
        
        for tag in soup.find_all(['a', 'link'], href=True):
            href = tag['href']
            full_url = urljoin(base_url, href)
            clean = self.clean_url(full_url)
            
            if self.is_valid_url(clean) and clean not in self.visited_urls:
                links.add(clean)
        
        return list(links)
    
    async def crawl_recursive(self, session: aiohttp.ClientSession, url: str, depth: int = 0):
        """Recursively crawl URLs up to max depth"""
        if depth > self.max_depth or url in self.visited_urls:
            return
        
        self.visited_urls.add(url)
        result = await self.fetch_url(session, url)
        self.results.append(result)
        
        if depth < self.max_depth and result['status'] == 200:
            tasks = []
            for link in result['links'][:10]:  # Limit concurrent requests
                if link not in self.visited_urls:
                    tasks.append(self.crawl_recursive(session, link, depth + 1))
            
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
    
    async def start_crawl(self) -> List[Dict]:
        """Start the crawling process"""
        connector = aiohttp.TCPConnector(ssl=False, limit=10)
        timeout_settings = aiohttp.ClientTimeout(total=self.timeout)
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout_settings) as session:
            await self.crawl_recursive(session, self.base_url)
        
        return self.results
    
    @staticmethod
    async def crawl(url: str, depth: int = 2) -> List[Dict]:
        """Static method to crawl a URL"""
        crawler = WebCrawler(url, depth)
        return await crawler.start_crawl()
