#!/bin/bash

echo "🧪 Testing Robots.txt Implementation"
echo "====================================="

# Test 1: Basic robots.txt access
echo "1. Testing basic robots.txt access..."
curl -s http://localhost:3000/robots.txt
echo -e "\n"

# Test 2: Check content-type header
echo "2. Testing content-type header..."
curl -I http://localhost:3000/robots.txt | grep -i "content-type"
echo -e "\n"

# Test 3: Test with different host
echo "3. Testing with example.com host..."
curl -s -H "Host: example.com" http://localhost:3000/robots.txt
echo -e "\n"

# Test 4: Test with non-existent domain
echo "4. Testing with non-existent domain..."
curl -s -H "Host: nonexistent.com" http://localhost:3000/robots.txt
echo -e "\n"

# Test 5: Check response time
echo "5. Testing response time..."
time curl -s http://localhost:3000/robots.txt > /dev/null
echo -e "\n"

echo "✅ Robots.txt testing complete!" 