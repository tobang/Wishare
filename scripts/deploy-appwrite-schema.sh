#!/bin/bash
set -e

echo "🚀 Deploying Appwrite Database Schema"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if appwrite CLI is installed
if ! command -v appwrite &> /dev/null; then
    echo -e "${RED}❌ Appwrite CLI not found${NC}"
    echo ""
    echo "Install it with:"
    echo "  npm install -g appwrite-cli"
    exit 1
fi

# Check if logged in
if ! appwrite account get &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in${NC}"
    echo "Run: appwrite login"
    exit 1
fi

echo -e "${GREEN}✓${NC} Appwrite CLI ready"
echo ""

cd "$(dirname "$0")/.."
echo "📍 Project: $(pwd)"
echo ""

if [ ! -f "appwrite.json" ]; then
    echo -e "${RED}❌ appwrite.json not found${NC}"
    exit 1
fi

echo "This will deploy:"
echo "  • Database: wishare"
echo "  • Collection: wishes (9 attributes)"
echo "  • Collection: wishlists (5 attributes)"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

echo ""
echo "🔧 Deploying..."
appwrite deploy collection

echo ""
echo -e "${GREEN}✅ Done!${NC}"
