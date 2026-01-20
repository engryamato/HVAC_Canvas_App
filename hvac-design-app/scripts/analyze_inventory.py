import json
import os

def analyze_inventory():
    with open('e2e_inventory.json', 'r') as f:
        data = json.load(f)
    
    total_tests = 0
    suites = {}
    
    for project in data.get('config', {}).get('projects', []):
        project_name = project['name']
        # We need to traverse the suite tree
        # The JSON structure for --list is slightly different, let's look at root suites
        pass

    # Actually, let's just dump a summary first
    # 'suites' in root contains the test files
    
    file_map = {}
    
    def traverse(suite, current_path=""):
        nonlocal total_tests
        title = suite.get('title', '')
        # If it's a file suite
        if suite.get('file'):
            current_path = suite.get('file')
            if current_path not in file_map:
                file_map[current_path] = 0
        
        # If it's a test case
        if suite.get('type') == 'test':
             total_tests += 1
             if current_path in file_map:
                 file_map[current_path] += 1
        
        for child in suite.get('suites', []):
            traverse(child, current_path)
            
        for spec in suite.get('specs', []):
            # Specs contain tests
            for test in spec.get('tests', []):
                total_tests += 1
                if current_path in file_map:
                    file_map[current_path] += 1

    for suite in data.get('suites', []):
        traverse(suite)

    print(f"Total Tests Found: {total_tests}")
    print(f"Total Files: {len(file_map)}")
    
    print("\n### Test Files & Counts")
    for f, count in sorted(file_map.items()):
        print(f"- `{f}`: {count} tests")

if __name__ == "__main__":
    analyze_inventory()
