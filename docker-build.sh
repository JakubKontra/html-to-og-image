#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[Build] Cleaning previous build artifacts..."
rm -rf dist function.zip

echo "[Build] Compiling TypeScript..."
npx tsc

echo "[Build] Building Docker image for Lambda packaging..."
docker build -t og-image-generator-build .

echo "[Build] Extracting function.zip from Docker container..."
CONTAINER_ID=$(docker create og-image-generator-build)
docker cp "$CONTAINER_ID:/build/function.zip" ./function.zip
docker rm "$CONTAINER_ID"

# Get ZIP file size
ZIP_SIZE=$(du -h function.zip | cut -f1)
echo "[Build] Lambda bundle created: function.zip ($ZIP_SIZE)"
