#!/bin/sh
# Container entrypoint: start the bgutil PO-token provider (if it was built) in
# the background so yt-dlp can mint Proof-of-Origin tokens locally, then hand off
# to the Next.js web server as the foreground process.

ENTRY=/opt/bgutil/server/build/main.js

if [ -f "$ENTRY" ]; then
  # Listens on 0.0.0.0:4416 by default, matching POT_PROVIDER_URL in the app.
  echo "[start] Launching PO-token provider: node $ENTRY"
  node "$ENTRY" &
else
  echo "[start] PO-token provider not built; relying on proxy/cookies only."
fi

# Hand control to Next.js (PID 1 replacement so signals are handled correctly).
exec npm start
