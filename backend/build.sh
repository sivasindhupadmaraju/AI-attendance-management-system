#!/usr/bin/env bash
set -e

# Install dlib precompiled binary to avoid source compilation


# Install other Python dependencies (including face_recognition which will use the preinstalled dlib)
pip install --no-cache-dir -r requirements.txt

# Seed the database (optional local dev step)
if [ -f seed_data.py ]; then
  python seed_data.py || echo "Seed data script failed, continuing..."
fi

echo "=== Build complete ==="
