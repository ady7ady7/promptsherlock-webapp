#!/bin/bash

# simple-test.sh - Quick test using cURL
# Usage: ./simple-test.sh

BACKEND_URL="https://prompt-sherlock.onrender.com"
FRONTEND_URL="https://prompt-sherlock.netlify.app"

echo "🔍 Testing Backend Configuration"
echo "=================================="
echo "Backend:  $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

# Test 1: Health Check
echo "📋 Test 1: Health Check"
echo "------------------------"
health_response=$(curl -s -w "STATUS:%{http_code}" "$BACKEND_URL/health")
status=$(echo "$health_response" | grep -o "STATUS:[0-9]*" | cut -d: -f2)

if [ "$status" = "200" ]; then
    echo "✅ Health check: PASSED"
    echo "   Backend is alive and responding"
else
    echo "❌ Health check: FAILED (Status: $status)"
    exit 1
fi

echo ""

# Test 2: CORS Preflight
echo "📋 Test 2: CORS Configuration"
echo "------------------------------"
cors_status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X OPTIONS \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "$BACKEND_URL/api/analyze")

cors_headers=$(curl -s -I \
    -X OPTIONS \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" \
    "$BACKEND_URL/api/analyze" | grep -i "access-control")

if [ "$cors_status" = "200" ] || [ "$cors_status" = "204" ]; then
    echo "✅ CORS preflight: PASSED (Status: $cors_status)"
    
    if echo "$cors_headers" | grep -q "access-control-allow-origin"; then
        origin_header=$(echo "$cors_headers" | grep -i "access-control-allow-origin" | cut -d: -f2- | tr -d '\r\n' | xargs)
        echo "   Allowed origin: $origin_header"
        
        if [ "$origin_header" = "$FRONTEND_URL" ] || [ "$origin_header" = "*" ]; then
            echo "   ✅ Your frontend domain is allowed"
        else
            echo "   ❌ Your frontend domain is NOT allowed"
            echo "   💡 Fix: Set FRONTEND_URL=$FRONTEND_URL in Render environment"
        fi
    else
        echo "   ⚠️  No CORS headers found"
    fi
else
    echo "❌ CORS preflight: FAILED (Status: $cors_status)"
    echo "   💡 Fix: Check CORS configuration in backend"
fi

echo ""

# Test 3: API Endpoint
echo "📋 Test 3: API Endpoint Test"
echo "-----------------------------"
api_response=$(curl -s -w "STATUS:%{http_code}" \
    -X POST \
    -H "Origin: $FRONTEND_URL" \
    -H "Content-Type: application/json" \
    -d '{}' \
    "$BACKEND_URL/api/analyze")

api_status=$(echo "$api_response" | grep -o "STATUS:[0-9]*" | cut -d: -f2)
api_body=$(echo "$api_response" | sed 's/STATUS:[0-9]*$//')

echo "   Status: $api_status"

if [ "$api_status" = "400" ]; then
    echo "✅ API endpoint: PASSED (Expected 400 for empty request)"
    echo "   Response: $(echo "$api_body" | jq -r '.error // "No images provided"' 2>/dev/null || echo "No images provided")"
elif [ "$api_status" = "403" ]; then
    echo "❌ API endpoint: CORS ERROR"
    echo "   Your frontend domain is being blocked"
    echo "   💡 Fix: Set FRONTEND_URL=$FRONTEND_URL in Render environment variables"
elif [ "$api_status" = "500" ]; then
    echo "❌ API endpoint: SERVER ERROR"
    echo "   💡 Fix: Check Render logs - likely missing GEMINI_API_KEY"
    echo "   Response: $api_body"
else
    echo "⚠️  API endpoint: UNEXPECTED STATUS ($api_status)"
    echo "   Response: $api_body"
fi

echo ""

# Test 4: Configuration Endpoint
echo "📋 Test 4: Configuration Check"
echo "-------------------------------"
config_status=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/analyze/config")

if [ "$config_status" = "200" ]; then
    echo "✅ Configuration endpoint: PASSED"
    config_data=$(curl -s "$BACKEND_URL/api/analyze/config")
    echo "   Max files: $(echo "$config_data" | jq -r '.config.upload.maxFiles // "10"' 2>/dev/null || echo "10")"
    echo "   Max size: $(echo "$config_data" | jq -r '.config.upload.maxFileSizeMB // "10"' 2>/dev/null || echo "10")MB"
else
    echo "❌ Configuration endpoint: FAILED (Status: $config_status)"
fi

echo ""

# Summary and recommendations
echo "📊 SUMMARY & NEXT STEPS"
echo "========================"

if [ "$status" = "200" ] && ([ "$cors_status" = "200" ] || [ "$cors_status" = "204" ]) && [ "$api_status" = "400" ]; then
    echo "🎉 Backend is working correctly!"
    echo ""
    echo "If your frontend still shows 'Network error':"
    echo "1. Check Netlify environment variables:"
    echo "   VITE_API_URL = $BACKEND_URL"
    echo "2. Redeploy your frontend after setting the variable"
    echo "3. Clear browser cache and try again"
    echo ""
    echo "Your environment should be:"
    echo "  Render backend:"
    echo "    FRONTEND_URL = $FRONTEND_URL"
    echo "    GEMINI_API_KEY = your_api_key"
    echo "  Netlify frontend:"
    echo "    VITE_API_URL = $BACKEND_URL"
else
    echo "❌ Some issues found:"
    
    if [ "$status" != "200" ]; then
        echo "• Backend health check failed"
    fi
    
    if [ "$cors_status" != "200" ] && [ "$cors_status" != "204" ]; then
        echo "• CORS configuration issue"
    fi
    
    if [ "$api_status" = "403" ]; then
        echo "• Frontend domain not allowed (CORS)"
    fi
    
    if [ "$api_status" = "500" ]; then
        echo "• Server error (check GEMINI_API_KEY)"
    fi
    
    echo ""
    echo "Priority fixes:"
    echo "1. Set FRONTEND_URL=$FRONTEND_URL in Render"
    echo "2. Set GEMINI_API_KEY in Render"
    echo "3. Redeploy backend service"
    echo "4. Set VITE_API_URL=$BACKEND_URL in Netlify"
    echo "5. Redeploy frontend"
fi

echo ""
echo "🔗 Quick verification URLs:"
echo "  Backend health: $BACKEND_URL/health"
echo "  Frontend site: $FRONTEND_URL"