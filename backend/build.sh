#!/usr/bin/env bash
# Build script for Render deployment
set -o errexit

echo "=== Installing Python dependencies ==="
pip install --upgrade pip

# ── Fix for Render OOM ──────────────────────────────────────────────
# dlib compiles from C++ source and needs >2 GB RAM, which exceeds
# Render free-tier limits.  dlib-bin ships pre-compiled wheels, so
# no compilation is required.
pip install --no-cache-dir dlib-bin

# Install face-recognition WITHOUT pulling the dlib pip package
# (dlib module is already provided by dlib-bin above).
pip install --no-cache-dir --no-deps face-recognition
# ────────────────────────────────────────────────────────────────────

# Install the remaining application dependencies
pip install --no-cache-dir -r requirements.txt

echo "=== Seeding database (creates admin user + mock data if empty) ==="
python seed_data.py

echo "=== Build complete ==="
