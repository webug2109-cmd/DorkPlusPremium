import aiohttp
import asyncio
from typing import Dict, List
import time

class ProxyTester:
    """Test proxy servers"""
    
    @staticmethod
    async def test_proxy(proxy: str, test_url: str = 'http://httpbin.org/ip', timeout: int = 5) -> Dict:
        """Test a single proxy"""
        start_time = time.time()
        
        # Parse proxy format: protocol://ip:port or ip:port
        if '://' in proxy:
            proxy_url = proxy
        else:
            # Assume HTTP if no protocol specified
            proxy_url = f'http://{proxy}'
        
        try:
            connector = aiohttp.TCPConnector(ssl=False)
            timeout_settings = aiohttp.ClientTimeout(total=timeout)
            
            async with aiohttp.ClientSession(connector=connector, timeout=timeout_settings) as session:
                async with session.get(test_url, proxy=proxy_url) as response:
                    response_time = time.time() - start_time
                    
                    if response.status == 200:
                        data = await response.json()
                        return {
                            'proxy': proxy,
                            'status': 'working',
                            'responseTime': round(response_time * 1000, 2),  # ms
                            'ip': data.get('origin', 'unknown'),
                            'protocol': proxy_url.split('://')[0] if '://' in proxy_url else 'http'
                        }
                    else:
                        return {
                            'proxy': proxy,
                            'status': 'failed',
                            'error': f'HTTP {response.status}',
                            'responseTime': round(response_time * 1000, 2)
                        }
        except asyncio.TimeoutError:
            return {
                'proxy': proxy,
                'status': 'timeout',
                'error': 'Connection timeout',
                'responseTime': timeout * 1000
            }
        except Exception as e:
            return {
                'proxy': proxy,
                'status': 'error',
                'error': str(e)[:100],
                'responseTime': round((time.time() - start_time) * 1000, 2)
            }
    
    @staticmethod
    async def test_multiple(proxies: List[str], test_url: str = 'http://httpbin.org/ip') -> List[Dict]:
        """Test multiple proxies concurrently"""
        tasks = [ProxyTester.test_proxy(proxy, test_url) for proxy in proxies]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions
        valid_results = []
        for result in results:
            if isinstance(result, dict):
                valid_results.append(result)
        
        return valid_results

class PortScanner:
    """Simple port scanner"""
    
    COMMON_PORTS = {
        21: 'FTP',
        22: 'SSH',
        23: 'Telnet',
        25: 'SMTP',
        53: 'DNS',
        80: 'HTTP',
        110: 'POP3',
        143: 'IMAP',
        443: 'HTTPS',
        445: 'SMB',
        3306: 'MySQL',
        3389: 'RDP',
        5432: 'PostgreSQL',
        5900: 'VNC',
        6379: 'Redis',
        8080: 'HTTP-Alt',
        8443: 'HTTPS-Alt',
        27017: 'MongoDB'
    }
    
    @staticmethod
    async def scan_port(host: str, port: int, timeout: int = 2) -> Dict:
        """Scan a single port"""
        try:
            conn = asyncio.open_connection(host, port)
            reader, writer = await asyncio.wait_for(conn, timeout=timeout)
            writer.close()
            await writer.wait_closed()
            
            service = PortScanner.COMMON_PORTS.get(port, 'Unknown')
            return {
                'port': port,
                'status': 'open',
                'service': service
            }
        except asyncio.TimeoutError:
            return {'port': port, 'status': 'filtered', 'service': 'N/A'}
        except:
            return {'port': port, 'status': 'closed', 'service': 'N/A'}
    
    @staticmethod
    async def scan_common_ports(host: str) -> List[Dict]:
        """Scan common ports"""
        tasks = [PortScanner.scan_port(host, port) for port in PortScanner.COMMON_PORTS.keys()]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Return only open ports
        return [r for r in results if isinstance(r, dict) and r['status'] == 'open']
