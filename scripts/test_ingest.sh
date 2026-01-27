#!/bin/bash

# Configuration
# Default URL to local function if not provided
FUNCTION_URL="${SUPABASE_FUNCTION_URL:-http://localhost:54321/functions/v1/ingest-content}"
# API Key must be provided via environment variable
API_KEY="${INGEST_API_KEY}"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Testing Ingest Content API"
echo "URL: $FUNCTION_URL"
echo "=========================================="

if [ -z "$API_KEY" ]; then
    echo -e "${RED}Error: INGEST_API_KEY environment variable is not set.${NC}"
    echo "Usage: INGEST_API_KEY=your_key ./scripts/test_ingest.sh"
    echo "You can also set SUPABASE_FUNCTION_URL if testing a remote endpoint."
    exit 1
fi

# Function to run test
run_test() {
    local name=$1
    local expected_status=$2
    local curl_cmd=$3

    echo -e "\nRunning test: ${name}..."

    # Run curl and capture http code and response body
    # using -w to get status code at the end
    response=$(eval "$curl_cmd -w \"\n%{http_code}\"")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC} (Status: $http_code)"
        echo "Response: $body"
    else
        echo -e "${RED}FAIL${NC} (Expected: $expected_status, Got: $http_code)"
        echo "Response: $body"
    fi
}

# 1. Test Missing API Key
run_test "Missing API Key" "401" \
    "curl -s -X POST \"$FUNCTION_URL\" \
    -H \"Content-Type: application/json\" \
    -d '{\"title\":\"Test\",\"content\":\"Content\"}'"

# 2. Test Invalid API Key
run_test "Invalid API Key" "403" \
    "curl -s -X POST \"$FUNCTION_URL\" \
    -H \"Content-Type: application/json\" \
    -H \"Authorization: Bearer invalid_key_12345\" \
    -d '{\"title\":\"Test\",\"content\":\"Content\"}'"

# 3. Test Invalid Payload (Missing Content) - Should be 400
run_test "Invalid Payload (Missing Content)" "400" \
    "curl -s -X POST \"$FUNCTION_URL\" \
    -H \"Content-Type: application/json\" \
    -H \"Authorization: Bearer $API_KEY\" \
    -d '{\"title\":\"Test Title\"}'"

# 4. Test Valid Payload
run_test "Valid Payload" "201" \
    "curl -s -X POST \"$FUNCTION_URL\" \
    -H \"Content-Type: application/json\" \
    -H \"Authorization: Bearer $API_KEY\" \
    -d '{\"title\":\"Test Title From Script\",\"content\":\"This is a test content from the curl script.\",\"tags\":[\"test\",\"script\"]}'"

echo -e "\n=========================================="
echo "Tests Completed"
echo "=========================================="
