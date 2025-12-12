# Base image with Node.js
FROM node:20-slim

# Install Python and build dependencies
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# --- Frontend Build ---
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Backend Setup ---
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install

# --- AI Service Setup ---
WORKDIR /app/ai_service
COPY ai_service/requirements.txt ./
# Create virtual environment and install requirements
RUN python3 -m venv /app/venv
RUN /app/venv/bin/pip install --no-cache-dir -r requirements.txt

# --- Final Configuration ---
WORKDIR /app

# Persistence Setup
RUN mkdir -p /app/data
ENV DB_PATH=/app/data/stockflow.db
VOLUME ["/app/data"]

# Copy start script
COPY start.sh .
RUN chmod +x start.sh

# Expose ports
EXPOSE 3000 8000

# Start services
CMD ["./start.sh"]
