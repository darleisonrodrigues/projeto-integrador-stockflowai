#!/bin/bash

# Start AI Service (Background)
echo "Starting AI Service..."
if [ -d "/app/venv" ]; then
    . /app/venv/bin/activate
fi
cd /app/ai_service
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Start Backend (Foreground)
echo "Starting Backend..."
cd /app/backend
npm start
