# Base image
FROM node:20-slim

# Install system dependencies (python3 is required for yt-dlp to run, ffmpeg for merging audio/video)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp via pip with curl-cffi for browser impersonation support
RUN pip3 install --break-system-packages "yt-dlp[default,curl-cffi]"

# Set working directory
WORKDIR /app

# Copy package dependency manifests
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy all source files
COPY . .

# Build the Next.js production bundle
RUN npm run build

# Expose Next.js default port
EXPOSE 3000

# Start the Next.js production web server
CMD ["npm", "start"]
