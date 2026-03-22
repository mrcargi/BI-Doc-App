#!/usr/bin/env bash
set -e

# Install Python deps
pip install -r requirements.txt

# Build React frontend (vite outputs directly to ../static-react)
cd frontend
npm install
npm run build
cd ..

# Ensure data directory exists
mkdir -p data