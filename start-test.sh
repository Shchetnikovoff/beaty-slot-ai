#!/bin/bash
# Beauty Slot - Quick Test Script
# Запускает Mini App и бота для локального тестирования

echo "🚀 Starting Beauty Slot Test Environment..."
echo ""

# Kill any existing processes on ports
echo "Cleaning up ports..."
npx kill-port 5173 4173 2>/dev/null

# Start Mini App dev server
echo "📱 Starting Mini App on port 5173..."
cd beauty-slot-miniapp
npm run dev &
MINIAPP_PID=$!
sleep 3

# Start Cloudflare Tunnel for Mini App
echo "🌐 Creating public tunnel..."
npx cloudflared tunnel --url http://localhost:5173 &
TUNNEL_PID=$!
sleep 5

echo ""
echo "⚠️  IMPORTANT: Copy the public URL from cloudflared output above"
echo "Then update MINIAPP_URL in beauty-slot-bot/bot.js"
echo ""

# Wait for user to update URL
read -p "Press Enter after updating the URL to start the bot..."

# Start bot
echo "🤖 Starting Telegram Bot..."
cd ../beauty-slot-bot
npm start

# Cleanup on exit
trap "kill $MINIAPP_PID $TUNNEL_PID 2>/dev/null" EXIT
