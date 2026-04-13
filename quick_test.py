#!/usr/bin/env python3
"""
Quick test to isolate the failing endpoints
"""

import requests
import json

BACKEND_URL = "https://dork-automation-tool.preview.emergentagent.com/api"

def test_endpoint(endpoint, method="GET", data=None):
    try:
        url = f"{BACKEND_URL}{endpoint}"
        print(f"Testing {method} {url}")
        
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"Success: {type(result)}")
                if isinstance(result, list):
                    print(f"List length: {len(result)}")
                elif isinstance(result, dict):
                    print(f"Dict keys: {list(result.keys())}")
                return True
            except:
                print(f"JSON decode error")
                return False
        else:
            print(f"Error: {response.text[:100]}")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        return False

# Test the failing endpoints
print("=== Testing /api/tasks ===")
test_endpoint("/tasks")

print("\n=== Testing dumper start ===")
result = test_endpoint("/dumper/start", "POST", {"targetUrl": "https://example.com/test.php?id=1"})

if result:
    print("\n=== Testing dumper results (will wait 3 seconds) ===")
    import time
    time.sleep(3)
    # We need to get the task ID, but for now let's test with a dummy ID
    test_endpoint("/dumper/results/dummy-id")