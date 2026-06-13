# Base image
FROM node:20-slim

# Install system dependencies:
#   ffmpeg   - merge audio/video, extract MP3
#   python3  - required to run yt-dlp
#   git      - fetch the PO-token provider source
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install the latest yt-dlp (with curl-cffi browser impersonation) and the
# bgutil PO-token client plugin. The PO token is what YouTube's "Sign in to
# confirm you're not a bot" check actually requires from datacenter IPs.
RUN pip3 install --break-system-packages -U \
    "yt-dlp[default,curl-cffi]" \
    bgutil-ytdlp-pot-provider

# Build the bgutil PO-token provider server (Node). It runs as a local sidecar
# that mints PO tokens for yt-dlp. Build failures are non-fatal: the app still
# runs (fall back to a proxy / cookies) instead of failing the whole image.
RUN git clone --depth 1 https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git /opt/bgutil \
    && cd /opt/bgutil/server \
    && npm install --no-audit --no-fund \
    && npx tsc \
    || echo "WARNING: PO-token provider build failed; continuing without the sidecar."

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

# Start the PO-token provider (if built) in the background, then the web server.
CMD ["sh", "/app/start.sh"]
