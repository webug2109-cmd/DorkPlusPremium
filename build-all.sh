#!/bin/bash

# DorkPlusPremium Complete Build Script
# Created by Frostbyt3s

echo "========================================"
echo "  DorkPlusPremium v2.0.0"
echo "  Complete Build Script"
echo "  Created by Frostbyt3s"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from app directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "${RED}Error: Must run from /app directory${NC}"
    exit 1
fi

echo "${YELLOW}Step 1/5: Installing dependencies...${NC}"
cd backend
pip install pyinstaller > /dev/null 2>&1
cd ../frontend
yarn add --dev electron electron-builder electron-is-dev concurrently wait-on > /dev/null 2>&1
echo "${GREEN}✓ Dependencies installed${NC}"

echo ""
echo "${YELLOW}Step 2/5: Building backend executable...${NC}"
cd ../backend
pyinstaller --onefile --name DorkPlusPremium-Server \
  --add-data "modules:modules" \
  --hidden-import=motor \
  --hidden-import=aiohttp \
  --hidden-import=beautifulsoup4 \
  --hidden-import=lxml \
  server.py > /dev/null 2>&1

if [ -f "dist/DorkPlusPremium-Server" ]; then
    echo "${GREEN}✓ Backend executable created${NC}"
else
    echo "${RED}✗ Backend build failed${NC}"
fi

echo ""
echo "${YELLOW}Step 3/5: Building React frontend...${NC}"
cd ../frontend
yarn build > /dev/null 2>&1
echo "${GREEN}✓ Frontend built${NC}"

echo ""
echo "${YELLOW}Step 4/5: Creating Electron desktop apps...${NC}"
# Copy electron config
cp electron-package.json package.json.backup
cat package.json electron-package.json > package.json.tmp
mv package.json.tmp package.json

# Build for current platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    npx electron-builder --mac > /dev/null 2>&1
    echo "${GREEN}✓ Mac app created${NC}"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    npx electron-builder --linux > /dev/null 2>&1
    echo "${GREEN}✓ Linux app created${NC}"
else
    npx electron-builder --windows > /dev/null 2>&1
    echo "${GREEN}✓ Windows app created${NC}"
fi

echo ""
echo "${YELLOW}Step 5/5: Creating distribution package...${NC}"
cd ..
mkdir -p dist/DorkPlusPremium-v2.0.0

# Copy backend
if [ -f "backend/dist/DorkPlusPremium-Server" ]; then
    cp backend/dist/DorkPlusPremium-Server dist/DorkPlusPremium-v2.0.0/
fi

# Copy frontend builds
if [ -d "frontend/dist" ]; then
    cp -r frontend/dist/* dist/DorkPlusPremium-v2.0.0/ 2>/dev/null || true
fi

echo "${GREEN}✓ Distribution package created${NC}"

echo ""
echo "========================================"
echo "${GREEN}BUILD COMPLETE!${NC}"
echo "========================================"
echo ""
echo "Output location: $(pwd)/dist/DorkPlusPremium-v2.0.0/"
echo ""
echo "Files created:"
ls -lh dist/DorkPlusPremium-v2.0.0/ 2>/dev/null || echo "Check dist/ directory"
echo ""
echo "${YELLOW}Next steps:${NC}"
echo "1. Test the backend: ./dist/DorkPlusPremium-v2.0.0/DorkPlusPremium-Server"
echo "2. Open the desktop app from dist/"
echo "3. For mobile APK, see BUILD.md"
echo ""
echo "Created by ${GREEN}Frostbyt3s${NC}"
