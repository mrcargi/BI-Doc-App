#!/usr/bin/env bash
set -e

# Install Python deps
pip install -r requirements.txt

# Build React frontend
cd frontend
npm install
npm run build
cd ..

# Copy build to static-react
rm -rf static-react/assets
cp -r frontend/dist/* static-react/

# Ensure data directory exists
mkdir -p data
