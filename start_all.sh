#!/bin/bash
echo "Starting VANNTAGGE Suite..."

ROOT_DIR=$(pwd)

# Install Python requirements if not done
cd "$ROOT_DIR/apps/nemo-guardrails"
if [ ! -d "venv" ]; then
    echo "Setting up Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo "Starting NeMo Guardrails on port 8000..."
python3 main.py &
NEMO_PID=$!

# Start NestJS API
echo "Starting NestJS Backend on port 4000..."
cd "$ROOT_DIR/apps/api"
npm run start:dev &
API_PID=$!

# Start Next.js Frontend
echo "Starting Next.js Frontend on port 3000..."
cd "$ROOT_DIR/apps/web"
npm run dev &
WEB_PID=$!

echo "All services started!"
echo "Press Ctrl+C to stop all services."

trap "kill $NEMO_PID $API_PID $WEB_PID; exit 0" SIGINT SIGTERM

wait
