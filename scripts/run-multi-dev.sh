#!/bin/bash

# Multi-site development server runner
# This script helps you run multiple Next.js development servers on different ports

echo "🚀 Multi-Site Development Server Runner"
echo "======================================="
echo ""

# Function to run a development server
run_dev_server() {
    local port=$1
    local site_name=$2
    
    echo "Starting $site_name on port $port..."
    npm run dev:site$((port - 2999)) &
    local pid=$!
    echo "✅ $site_name started (PID: $pid) - http://localhost:$port"
    return $pid
}

# Function to cleanup processes
cleanup() {
    echo ""
    echo "🛑 Stopping all development servers..."
    jobs -p | xargs -r kill
    echo "✅ All servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "Choose an option:"
echo "1) Run Site 1 only (port 3000)"
echo "2) Run Site 2 only (port 3001)"
echo "3) Run both Site 1 and Site 2"
echo "4) Run all sites (ports 3000-3003)"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "Starting Site 1 only..."
        npm run dev:site1
        ;;
    2)
        echo "Starting Site 2 only..."
        npm run dev:site2
        ;;
    3)
        echo "Starting Site 1 and Site 2..."
        run_dev_server 3000 "Site 1"
        run_dev_server 3001 "Site 2"
        echo ""
        echo "🌐 Sites running:"
        echo "   Site 1: http://localhost:3000"
        echo "   Site 2: http://localhost:3001"
        echo ""
        echo "Press Ctrl+C to stop all servers"
        wait
        ;;
    4)
        echo "Starting all sites..."
        run_dev_server 3000 "Site 1"
        run_dev_server 3001 "Site 2"
        run_dev_server 3002 "Site 3"
        run_dev_server 3003 "Site 4"
        echo ""
        echo "🌐 All sites running:"
        echo "   Site 1: http://localhost:3000"
        echo "   Site 2: http://localhost:3001"
        echo "   Site 3: http://localhost:3002"
        echo "   Site 4: http://localhost:3003"
        echo ""
        echo "Press Ctrl+C to stop all servers"
        wait
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac 