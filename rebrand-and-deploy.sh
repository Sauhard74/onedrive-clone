#!/bin/bash

# OneDrive Clone - Rebrand and Deploy Script
# This script modifies Pydio Cells to look like Microsoft OneDrive

set -e

echo "🎨 OneDrive Clone - Rebrand and Deploy"
echo "========================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd "$(dirname "$0")"

echo -e "${BLUE}Step 1: Stopping existing Pydio Cells...${NC}"
pkill -f "cells" || true
sleep 2

echo -e "${BLUE}Step 2: Copying OneDrive theme CSS...${NC}"
cp branding/css/onedrive-theme.css cells/frontend/assets/gui.ajax/res/dist/onedrive-theme.css
echo -e "${GREEN}✓ CSS copied${NC}"

echo -e "${BLUE}Step 3: Rebuilding Pydio Cells binary...${NC}"
cd cells
make dev
echo -e "${GREEN}✓ Cells rebuilt${NC}"

echo -e "${BLUE}Step 4: Starting Pydio Cells...${NC}"
nohup ./cells start > /tmp/cells-output.log 2>&1 &
CELLS_PID=$!
echo "Cells PID: $CELLS_PID"

echo -e "${BLUE}Step 5: Waiting for Cells to be ready...${NC}"
echo "This may take 30-60 seconds..."

for i in {1..30}; do
    sleep 2
    if curl -k -s https://localhost:8081/a/frontend/bootconf > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Cells is ready!${NC}"
        break
    fi
    echo -n "."
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ OneDrive Clone is now running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Access your OneDrive clone at:"
echo -e "${BLUE}https://localhost:8081${NC}"
echo ""
echo "Login credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Cells PID: $CELLS_PID"
echo "Logs: tail -f /tmp/cells-output.log"
echo ""
