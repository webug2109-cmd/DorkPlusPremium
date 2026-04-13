#!/usr/bin/env python3
"""
DorkPlus Security Testing API - Comprehensive Backend Tests
Tests all API endpoints as specified in the review request
"""

import requests
import json
import time
import sys
from typing import Dict, Any, Optional

# Backend URL from frontend .env
BACKEND_URL = "https://dork-automation-tool.preview.emergentagent.com/api"

class DorkPlusAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.task_ids = []  # Store task IDs for cleanup
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'response': response_data
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, timeout: int = 30) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BACKEND_URL}{endpoint}"
            print(f"Making {method} request to: {url}")
            if data:
                print(f"Request data: {json.dumps(data, indent=2)}")
            
            if method.upper() == 'GET':
                response = self.session.get(url, timeout=timeout)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=timeout)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, timeout=timeout)
            else:
                return False, f"Unsupported method: {method}", 0
            
            print(f"Response status: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"Response data: {json.dumps(response_data, indent=2)}")
            except:
                response_data = response.text
                print(f"Response text: {response_data}")
            
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.Timeout:
            return False, "Request timeout", 0
        except requests.exceptions.ConnectionError:
            return False, "Connection error", 0
        except Exception as e:
            return False, f"Request error: {str(e)}", 0
    
    def test_root_endpoint(self):
        """Test 8: Root Endpoint - GET /api/"""
        print("=" * 60)
        print("TEST 8: Root Endpoint")
        print("=" * 60)
        
        success, response_data, status_code = self.make_request('GET', '/')
        
        if success and isinstance(response_data, dict):
            required_fields = ['message', 'version', 'endpoints']
            has_all_fields = all(field in response_data for field in required_fields)
            
            if has_all_fields:
                self.log_test("Root endpoint returns API info", True, 
                            f"Version: {response_data.get('version')}, Message: {response_data.get('message')}")
            else:
                self.log_test("Root endpoint returns API info", False, 
                            f"Missing required fields. Expected: {required_fields}")
        else:
            self.log_test("Root endpoint returns API info", False, 
                        f"Invalid response format or request failed", response_data)
    
    def test_statistics_endpoint(self):
        """Test 1: Statistics Endpoint - GET /api/statistics"""
        print("=" * 60)
        print("TEST 1: Statistics Endpoint")
        print("=" * 60)
        
        success, response_data, status_code = self.make_request('GET', '/statistics')
        
        if success and isinstance(response_data, dict):
            required_fields = ['totalScans', 'vulnerabilitiesFound', 'crawledPages', 
                             'generatedDorks', 'activeScans', 'completedScans']
            has_all_fields = all(field in response_data for field in required_fields)
            
            if has_all_fields:
                self.log_test("Statistics endpoint returns all required fields", True, 
                            f"Fields present: {list(response_data.keys())}")
            else:
                missing_fields = [f for f in required_fields if f not in response_data]
                self.log_test("Statistics endpoint returns all required fields", False, 
                            f"Missing fields: {missing_fields}")
        else:
            self.log_test("Statistics endpoint returns all required fields", False, 
                        "Invalid response format or request failed", response_data)
    
    def test_dork_generator(self):
        """Test 2: Dork Generator - POST /api/dork/generate"""
        print("=" * 60)
        print("TEST 2: Dork Generator")
        print("=" * 60)
        
        # Test different dork types
        dork_types = ["admin", "database", "sensitive", "config"]
        
        for dork_type in dork_types:
            test_data = {
                "target": "example.com",
                "dorkType": dork_type
            }
            
            success, response_data, status_code = self.make_request('POST', '/dork/generate', test_data)
            
            if success and isinstance(response_data, dict):
                if 'dorks' in response_data and isinstance(response_data['dorks'], list):
                    dorks_count = len(response_data['dorks'])
                    self.log_test(f"Dork generation for type '{dork_type}'", True, 
                                f"Generated {dorks_count} dorks")
                else:
                    self.log_test(f"Dork generation for type '{dork_type}'", False, 
                                "Response missing 'dorks' array", response_data)
            else:
                self.log_test(f"Dork generation for type '{dork_type}'", False, 
                            "Request failed or invalid response", response_data)
    
    def test_web_crawler(self):
        """Test 3: Web Crawler - POST /api/crawler/start and GET /api/crawler/results/{taskId}"""
        print("=" * 60)
        print("TEST 3: Web Crawler")
        print("=" * 60)
        
        # Start crawler
        crawler_data = {
            "url": "https://example.com",
            "depth": 2
        }
        
        success, response_data, status_code = self.make_request('POST', '/crawler/start', crawler_data)
        
        if success and isinstance(response_data, dict):
            if 'taskId' in response_data and 'status' in response_data:
                task_id = response_data['taskId']
                self.task_ids.append(task_id)
                self.log_test("Crawler start request", True, 
                            f"Task ID: {task_id}, Status: {response_data['status']}")
                
                # Wait a moment for task to process
                time.sleep(2)
                
                # Check results
                success_results, results_data, _ = self.make_request('GET', f'/crawler/results/{task_id}')
                
                if success_results and isinstance(results_data, dict):
                    if 'task' in results_data:
                        task_status = results_data['task'].get('status', 'unknown')
                        self.log_test("Crawler results retrieval", True, 
                                    f"Task status: {task_status}")
                    else:
                        self.log_test("Crawler results retrieval", False, 
                                    "Response missing 'task' field", results_data)
                else:
                    self.log_test("Crawler results retrieval", False, 
                                "Failed to retrieve results", results_data)
            else:
                self.log_test("Crawler start request", False, 
                            "Response missing 'taskId' or 'status'", response_data)
        else:
            self.log_test("Crawler start request", False, 
                        "Request failed or invalid response", response_data)
    
    def test_keyword_extractor(self):
        """Test 4: Keyword Extractor - POST /api/keywords/extract"""
        print("=" * 60)
        print("TEST 4: Keyword Extractor")
        print("=" * 60)
        
        test_data = {
            "customText": "This is a test with admin password login database credentials"
        }
        
        success, response_data, status_code = self.make_request('POST', '/keywords/extract', test_data)
        
        if success and isinstance(response_data, dict):
            if 'keywords' in response_data and isinstance(response_data['keywords'], list):
                keywords = response_data['keywords']
                expected_keywords = ["admin", "password", "login", "database"]
                found_keywords = [kw for kw in expected_keywords if kw in keywords]
                
                self.log_test("Keyword extraction", True, 
                            f"Extracted {len(keywords)} keywords, found expected: {found_keywords}")
            else:
                self.log_test("Keyword extraction", False, 
                            "Response missing 'keywords' array", response_data)
        else:
            self.log_test("Keyword extraction", False, 
                        "Request failed or invalid response", response_data)
    
    def test_sqli_scanner(self):
        """Test 5: SQLi Scanner - POST /api/sqli/scan and GET /api/sqli/results/{taskId}"""
        print("=" * 60)
        print("TEST 5: SQLi Scanner")
        print("=" * 60)
        
        # Start SQLi scan
        sqli_data = {
            "targetUrl": "https://example.com/test.php?id=1",
            "scanType": "auto"
        }
        
        success, response_data, status_code = self.make_request('POST', '/sqli/scan', sqli_data)
        
        if success and isinstance(response_data, dict):
            if 'taskId' in response_data and 'status' in response_data:
                task_id = response_data['taskId']
                self.task_ids.append(task_id)
                expected_status = "scanning"
                actual_status = response_data['status']
                
                if actual_status == expected_status:
                    self.log_test("SQLi scan start", True, 
                                f"Task ID: {task_id}, Status: {actual_status}")
                else:
                    self.log_test("SQLi scan start", False, 
                                f"Expected status '{expected_status}', got '{actual_status}'")
                
                # Wait a moment for task to process
                time.sleep(2)
                
                # Check results
                success_results, results_data, _ = self.make_request('GET', f'/sqli/results/{task_id}')
                
                if success_results and isinstance(results_data, dict):
                    if 'task' in results_data:
                        task_status = results_data['task'].get('status', 'unknown')
                        self.log_test("SQLi results retrieval", True, 
                                    f"Task status: {task_status}")
                    else:
                        self.log_test("SQLi results retrieval", False, 
                                    "Response missing 'task' field", results_data)
                else:
                    self.log_test("SQLi results retrieval", False, 
                                "Failed to retrieve results", results_data)
            else:
                self.log_test("SQLi scan start", False, 
                            "Response missing 'taskId' or 'status'", response_data)
        else:
            self.log_test("SQLi scan start", False, 
                        "Request failed or invalid response", response_data)
    
    def test_sql_dumper(self):
        """Test 6: SQL Dumper - POST /api/dumper/start and GET /api/dumper/results/{taskId}"""
        print("=" * 60)
        print("TEST 6: SQL Dumper")
        print("=" * 60)
        
        # Start SQL dumper
        dumper_data = {
            "targetUrl": "https://example.com/vuln.php?id=1"
        }
        
        success, response_data, status_code = self.make_request('POST', '/dumper/start', dumper_data)
        
        if success and isinstance(response_data, dict):
            if 'taskId' in response_data and 'status' in response_data:
                task_id = response_data['taskId']
                self.task_ids.append(task_id)
                expected_status = "dumping"
                actual_status = response_data['status']
                
                if actual_status == expected_status:
                    self.log_test("SQL dumper start", True, 
                                f"Task ID: {task_id}, Status: {actual_status}")
                else:
                    self.log_test("SQL dumper start", False, 
                                f"Expected status '{expected_status}', got '{actual_status}'")
                
                # Wait a moment for task to process
                time.sleep(2)
                
                # Check results
                success_results, results_data, _ = self.make_request('GET', f'/dumper/results/{task_id}')
                
                if success_results and isinstance(results_data, dict):
                    if 'task' in results_data:
                        task_status = results_data['task'].get('status', 'unknown')
                        self.log_test("SQL dumper results retrieval", True, 
                                    f"Task status: {task_status}")
                    else:
                        self.log_test("SQL dumper results retrieval", False, 
                                    "Response missing 'task' field", results_data)
                else:
                    self.log_test("SQL dumper results retrieval", False, 
                                "Failed to retrieve results", results_data)
            else:
                self.log_test("SQL dumper start", False, 
                            "Response missing 'taskId' or 'status'", response_data)
        else:
            self.log_test("SQL dumper start", False, 
                        "Request failed or invalid response", response_data)
    
    def test_tasks_management(self):
        """Test 7: Tasks Management - GET /api/tasks, GET /api/tasks/{taskId}, DELETE /api/tasks/{taskId}"""
        print("=" * 60)
        print("TEST 7: Tasks Management")
        print("=" * 60)
        
        # Get all tasks
        success, response_data, status_code = self.make_request('GET', '/tasks')
        
        if success and isinstance(response_data, list):
            self.log_test("Get all tasks", True, 
                        f"Retrieved {len(response_data)} tasks")
            
            # Test specific task retrieval if we have task IDs
            if self.task_ids:
                task_id = self.task_ids[0]
                success_specific, specific_data, _ = self.make_request('GET', f'/tasks/{task_id}')
                
                if success_specific and isinstance(specific_data, dict):
                    if 'id' in specific_data:
                        self.log_test("Get specific task", True, 
                                    f"Retrieved task with ID: {specific_data['id']}")
                    else:
                        self.log_test("Get specific task", False, 
                                    "Response missing 'id' field", specific_data)
                else:
                    self.log_test("Get specific task", False, 
                                "Failed to retrieve specific task", specific_data)
                
                # Test task deletion
                success_delete, delete_data, _ = self.make_request('DELETE', f'/tasks/{task_id}')
                
                if success_delete:
                    self.log_test("Delete task", True, 
                                f"Successfully deleted task {task_id}")
                    # Remove from our list since it's deleted
                    self.task_ids.remove(task_id)
                else:
                    self.log_test("Delete task", False, 
                                "Failed to delete task", delete_data)
            else:
                self.log_test("Get specific task", False, 
                            "No task IDs available for testing")
                self.log_test("Delete task", False, 
                            "No task IDs available for testing")
        else:
            self.log_test("Get all tasks", False, 
                        "Request failed or invalid response format", response_data)
    
    def cleanup_tasks(self):
        """Clean up any remaining test tasks"""
        print("=" * 60)
        print("CLEANUP: Removing test tasks")
        print("=" * 60)
        
        for task_id in self.task_ids:
            success, response_data, _ = self.make_request('DELETE', f'/tasks/{task_id}')
            if success:
                print(f"✅ Cleaned up task: {task_id}")
            else:
                print(f"❌ Failed to clean up task: {task_id}")
    
    def run_all_tests(self):
        """Run all tests in the specified order"""
        print("🚀 Starting DorkPlus Security Testing API Tests")
        print("=" * 80)
        
        # Run tests in order
        self.test_root_endpoint()
        self.test_statistics_endpoint()
        self.test_dork_generator()
        self.test_web_crawler()
        self.test_keyword_extractor()
        self.test_sqli_scanner()
        self.test_sql_dumper()
        self.test_tasks_management()
        
        # Cleanup
        if self.task_ids:
            self.cleanup_tasks()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"❌ {result['test']}: {result['details']}")
        
        print("\n" + "=" * 80)
        return failed_tests == 0

if __name__ == "__main__":
    tester = DorkPlusAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)