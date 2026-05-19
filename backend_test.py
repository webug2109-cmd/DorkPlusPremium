#!/usr/bin/env python3
"""
DorkPlusPremium v2.0.0 Backend API Testing Suite
Tests all new features: License System, Hash Tools, Encoders, User Agents, Network Tools
"""

import requests
import json
import time
from datetime import datetime

# Backend URL from frontend environment
BACKEND_URL = "http://localhost:8000/api"

class DorkPlusPremiumTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, details="", error=""):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'error': error,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()
    
    def test_api_root(self):
        """Test API root endpoint - should show v2.0.0"""
        try:
            response = self.session.get(f"{BACKEND_URL}/")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                if (data.get('name') == 'DorkPlusPremium Security Testing API' and
                    data.get('version') == '2.0.0' and
                    data.get('author') == 'Frostbyt3s'):
                    
                    self.log_test(
                        "API Root Endpoint",
                        True,
                        f"Version: {data.get('version')}, Name: {data.get('name')}, Author: {data.get('author')}"
                    )
                else:
                    self.log_test(
                        "API Root Endpoint",
                        False,
                        f"Unexpected response data: {data}",
                        "Missing required fields or incorrect values"
                    )
            else:
                self.log_test(
                    "API Root Endpoint",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("API Root Endpoint", False, "", str(e))
    
    def test_license_system(self):
        """Test License System endpoints"""
        
        # Test 1: Generate 1 month license
        try:
            response = self.session.post(f"{BACKEND_URL}/license/generate?duration=1month")
            
            if response.status_code == 200:
                data = response.json()
                if 'key' in data and 'duration' in data and 'expiresAt' in data:
                    license_key = data['key']
                    self.log_test(
                        "License Generate (1month)",
                        True,
                        f"Generated key: {license_key[:15]}..., Duration: {data['duration']}"
                    )
                    
                    # Test license validation with generated key
                    self.test_license_validation(license_key)
                else:
                    self.log_test(
                        "License Generate (1month)",
                        False,
                        f"Missing required fields in response: {data}"
                    )
            else:
                self.log_test(
                    "License Generate (1month)",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("License Generate (1month)", False, "", str(e))
        
        # Test 2: Generate 1 year license
        try:
            response = self.session.post(f"{BACKEND_URL}/license/generate?duration=1year")
            
            if response.status_code == 200:
                data = response.json()
                if 'key' in data and data['duration'] == '1year':
                    self.log_test(
                        "License Generate (1year)",
                        True,
                        f"Generated key: {data['key'][:15]}..., Duration: {data['duration']}"
                    )
                else:
                    self.log_test(
                        "License Generate (1year)",
                        False,
                        f"Unexpected response: {data}"
                    )
            else:
                self.log_test(
                    "License Generate (1year)",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("License Generate (1year)", False, "", str(e))
        
        # Test 3: Generate bulk licenses
        try:
            response = self.session.get(f"{BACKEND_URL}/license/generate-bulk/1week/5")
            
            if response.status_code == 200:
                data = response.json()
                if 'licenses' in data and 'count' in data and data['count'] == 5:
                    self.log_test(
                        "License Generate Bulk (1week/5)",
                        True,
                        f"Generated {data['count']} licenses successfully"
                    )
                else:
                    self.log_test(
                        "License Generate Bulk (1week/5)",
                        False,
                        f"Unexpected response: {data}"
                    )
            else:
                self.log_test(
                    "License Generate Bulk (1week/5)",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("License Generate Bulk (1week/5)", False, "", str(e))
    
    def test_license_validation(self, license_key):
        """Test license validation with a valid key"""
        try:
            response = self.session.post(f"{BACKEND_URL}/license/validate?key={license_key}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('valid') == True:
                    self.log_test(
                        "License Validation",
                        True,
                        f"Valid license confirmed, expires: {data.get('expiresAt', 'N/A')}"
                    )
                else:
                    self.log_test(
                        "License Validation",
                        False,
                        f"License marked as invalid: {data}"
                    )
            else:
                self.log_test(
                    "License Validation",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("License Validation", False, "", str(e))
    
    def test_hash_tools(self):
        """Test Hash Tools utilities"""
        
        # Test 1: Hash identification
        try:
            test_hash = "5d41402abc4b2a76b9719d911017c592"  # MD5 of "hello"
            response = self.session.post(f"{BACKEND_URL}/utilities/hash/identify?hash_string={test_hash}")
            
            if response.status_code == 200:
                data = response.json()
                if 'possibleTypes' in data and 'MD5' in data['possibleTypes']:
                    self.log_test(
                        "Hash Identification",
                        True,
                        f"Correctly identified MD5 hash. Types: {data['possibleTypes']}"
                    )
                else:
                    self.log_test(
                        "Hash Identification",
                        False,
                        f"Failed to identify MD5 hash: {data}"
                    )
            else:
                self.log_test(
                    "Hash Identification",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Hash Identification", False, "", str(e))
        
        # Test 2: SHA256 hash generation
        try:
            response = self.session.post(f"{BACKEND_URL}/utilities/hash/generate?text=hello&algorithm=sha256")
            
            if response.status_code == 200:
                data = response.json()
                expected_sha256 = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"  # Full SHA256 of "hello"
                if (data.get('algorithm') == 'sha256' and 
                    data.get('text') == 'hello' and 
                    data.get('hash') == expected_sha256):
                    self.log_test(
                        "Hash Generation (SHA256)",
                        True,
                        f"Generated correct SHA256: {data['hash'][:32]}..."
                    )
                else:
                    self.log_test(
                        "Hash Generation (SHA256)",
                        False,
                        f"Unexpected hash result: {data}",
                        f"Expected: {expected_sha256}, Got: {data.get('hash')}"
                    )
            else:
                self.log_test(
                    "Hash Generation (SHA256)",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Hash Generation (SHA256)", False, "", str(e))
        
        # Test 3: MD5 hash generation
        try:
            response = self.session.post(f"{BACKEND_URL}/utilities/hash/generate?text=test&algorithm=md5")
            
            if response.status_code == 200:
                data = response.json()
                expected_md5 = "098f6bcd4621d373cade4e832627b4f6"  # MD5 of "test"
                if (data.get('algorithm') == 'md5' and 
                    data.get('text') == 'test' and 
                    data.get('hash') == expected_md5):
                    self.log_test(
                        "Hash Generation (MD5)",
                        True,
                        f"Generated correct MD5: {data['hash']}"
                    )
                else:
                    self.log_test(
                        "Hash Generation (MD5)",
                        False,
                        f"Incorrect MD5 hash: {data}"
                    )
            else:
                self.log_test(
                    "Hash Generation (MD5)",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Hash Generation (MD5)", False, "", str(e))
    
    def test_encoders(self):
        """Test Encoder/Decoder utilities"""
        
        # Test 1: Base64 encoding
        try:
            test_text = "DorkPlusPremium"
            response = self.session.post(f"{BACKEND_URL}/utilities/encode/base64?text={test_text}")
            
            if response.status_code == 200:
                data = response.json()
                expected_b64 = "RG9ya1BsdXNQcmVtaXVt"  # Base64 of "DorkPlusPremium"
                if (data.get('original') == test_text and 
                    data.get('encoded') == expected_b64):
                    encoded_value = data['encoded']
                    self.log_test(
                        "Base64 Encoding",
                        True,
                        f"Encoded '{test_text}' to '{encoded_value}'"
                    )
                    
                    # Test Base64 decoding
                    self.test_base64_decoding(encoded_value, test_text)
                else:
                    self.log_test(
                        "Base64 Encoding",
                        False,
                        f"Incorrect encoding result: {data}"
                    )
            else:
                self.log_test(
                    "Base64 Encoding",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Base64 Encoding", False, "", str(e))
        
        # Test 2: URL encoding
        try:
            test_text = "hello world test"
            response = self.session.post(f"{BACKEND_URL}/utilities/encode/url?text={test_text}")
            
            if response.status_code == 200:
                data = response.json()
                expected_url = "hello%20world%20test"
                if (data.get('original') == test_text and 
                    data.get('encoded') == expected_url):
                    encoded_value = data['encoded']
                    self.log_test(
                        "URL Encoding",
                        True,
                        f"Encoded '{test_text}' to '{encoded_value}'"
                    )
                    
                    # Test URL decoding
                    self.test_url_decoding(encoded_value, test_text)
                else:
                    self.log_test(
                        "URL Encoding",
                        False,
                        f"Incorrect URL encoding: {data}"
                    )
            else:
                self.log_test(
                    "URL Encoding",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("URL Encoding", False, "", str(e))
    
    def test_base64_decoding(self, encoded_value, expected_text):
        """Test Base64 decoding"""
        try:
            response = self.session.post(f"{BACKEND_URL}/utilities/decode/base64?encoded={encoded_value}")
            
            if response.status_code == 200:
                data = response.json()
                if (data.get('encoded') == encoded_value and 
                    data.get('decoded') == expected_text):
                    self.log_test(
                        "Base64 Decoding",
                        True,
                        f"Decoded '{encoded_value}' to '{data['decoded']}'"
                    )
                else:
                    self.log_test(
                        "Base64 Decoding",
                        False,
                        f"Incorrect decoding result: {data}"
                    )
            else:
                self.log_test(
                    "Base64 Decoding",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Base64 Decoding", False, "", str(e))
    
    def test_url_decoding(self, encoded_value, expected_text):
        """Test URL decoding"""
        try:
            # URL encode the parameter to prevent double-decoding by HTTP request
            import urllib.parse
            url_param = urllib.parse.quote(encoded_value)
            response = self.session.post(f"{BACKEND_URL}/utilities/decode/url?encoded={url_param}")
            
            if response.status_code == 200:
                data = response.json()
                if (data.get('encoded') == encoded_value and 
                    data.get('decoded') == expected_text):
                    self.log_test(
                        "URL Decoding",
                        True,
                        f"Decoded '{encoded_value}' to '{data['decoded']}'"
                    )
                else:
                    self.log_test(
                        "URL Decoding",
                        False,
                        f"Incorrect URL decoding: {data}",
                        f"Expected decoded: '{expected_text}', got: '{data.get('decoded')}'"
                    )
            else:
                self.log_test(
                    "URL Decoding",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("URL Decoding", False, "", str(e))
    
    def test_user_agents(self):
        """Test User Agent utilities"""
        
        # Test 1: Random user agent
        try:
            response = self.session.get(f"{BACKEND_URL}/utilities/useragent/random")
            
            if response.status_code == 200:
                data = response.json()
                if 'userAgent' in data and len(data['userAgent']) > 50:
                    self.log_test(
                        "Random User Agent",
                        True,
                        f"Generated user agent: {data['userAgent'][:60]}..."
                    )
                else:
                    self.log_test(
                        "Random User Agent",
                        False,
                        f"Invalid user agent response: {data}"
                    )
            else:
                self.log_test(
                    "Random User Agent",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Random User Agent", False, "", str(e))
        
        # Test 2: All user agents
        try:
            response = self.session.get(f"{BACKEND_URL}/utilities/useragent/all")
            
            if response.status_code == 200:
                data = response.json()
                if ('userAgents' in data and 'count' in data and 
                    isinstance(data['userAgents'], list) and 
                    data['count'] > 5):
                    self.log_test(
                        "All User Agents",
                        True,
                        f"Retrieved {data['count']} user agents"
                    )
                else:
                    self.log_test(
                        "All User Agents",
                        False,
                        f"Invalid user agents list: {data}"
                    )
            else:
                self.log_test(
                    "All User Agents",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("All User Agents", False, "", str(e))
    
    def test_network_tools(self):
        """Test Network Tools"""
        
        # Test 1: Proxy testing
        try:
            # Test with a simple proxy format using query parameter
            test_proxy = "8.8.8.8:80"
            response = self.session.post(f"{BACKEND_URL}/network/proxy/test?proxy={test_proxy}")
            
            if response.status_code == 200:
                data = response.json()
                if 'proxy' in data and 'status' in data:
                    self.log_test(
                        "Proxy Testing",
                        True,
                        f"Tested proxy {data['proxy']}, Status: {data['status']}"
                    )
                else:
                    self.log_test(
                        "Proxy Testing",
                        False,
                        f"Invalid proxy test response: {data}"
                    )
            else:
                self.log_test(
                    "Proxy Testing",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Proxy Testing", False, "", str(e))
        
        # Test 2: Port scanning
        try:
            response = self.session.post(f"{BACKEND_URL}/network/port/scan?host=google.com")
            
            if response.status_code == 200:
                data = response.json()
                if 'host' in data and 'openPorts' in data:
                    open_ports = data['openPorts']
                    self.log_test(
                        "Port Scanning",
                        True,
                        f"Scanned {data['host']}, Found {len(open_ports)} open ports"
                    )
                else:
                    self.log_test(
                        "Port Scanning",
                        False,
                        f"Invalid port scan response: {data}"
                    )
            else:
                self.log_test(
                    "Port Scanning",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_test("Port Scanning", False, "", str(e))
    
    def run_all_tests(self):
        """Run all DorkPlusPremium v2.0.0 tests"""
        print("=" * 60)
        print("DorkPlusPremium v2.0.0 Backend API Testing Suite")
        print("=" * 60)
        print()
        
        # Test API Root
        self.test_api_root()
        
        # Test License System
        print("🔑 Testing License System...")
        self.test_license_system()
        
        # Test Hash Tools
        print("🔐 Testing Hash Tools...")
        self.test_hash_tools()
        
        # Test Encoders
        print("📝 Testing Encoders/Decoders...")
        self.test_encoders()
        
        # Test User Agents
        print("🌐 Testing User Agent Tools...")
        self.test_user_agents()
        
        # Test Network Tools
        print("🌍 Testing Network Tools...")
        self.test_network_tools()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        print()
        
        if failed > 0:
            print("FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"❌ {result['test']}: {result['error']}")
        else:
            print("🎉 ALL TESTS PASSED!")
        
        print("=" * 60)

if __name__ == "__main__":
    tester = DorkPlusPremiumTester()
    tester.run_all_tests()