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

echo -e "${RED}⚠️  WARNING: 'appwrite push tables' can DELETE existing data!${NC}"
echo ""
echo "This script is DANGEROUS and should only be used for:"
echo "  • Initial setup of a NEW database"
echo "  • Development/testing environments"
echo ""
echo -e "${YELLOW}For production, manually update the schema in Appwrite Console.${NC}"
echo ""
read -p "Type 'DELETE' to confirm you understand data may be lost: " CONFIRM
if [[ "$CONFIRM" != "DELETE" ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "🔧 Deploying TablesDB schema..."
appwrite push tables

echo ""
echo -e "${GREEN}✅ Done!${NC}"
echo ""
echo -e "${YELLOW}Note: If the relationship wasn't created, you may need to manually"
echo "create it in the Appwrite Console under TablesDB → wishlists → Columns${NC}"
