#!/bin/bash

# Definition of colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Checking architecture boundaries...${NC}"

VIOLATIONS=0

# Rule 1: UI components (components/features) should NOT import from Domain layer
echo -e "\n${YELLOW}1. Checking for Domain leaks in UI...${NC}"
DOMAIN_LEAKS=$(grep -r "from.*domain" src/components src/features --include="*.tsx" --include="*.ts" | grep -v "test")

if [ ! -z "$DOMAIN_LEAKS" ]; then
    echo -e "${RED}❌ VIOLATION: Domain layer imported in UI components:${NC}"
    echo "$DOMAIN_LEAKS"
    VIOLATIONS=$((VIOLATIONS+1))
else
    echo -e "${GREEN}✅ OK: No direct Domain access in UI.${NC}"
fi

# Rule 2: UI components should NOT import from Storage (Infrastructure)
echo -e "\n${YELLOW}2. Checking for Storage leaks in UI...${NC}"
STORAGE_LEAKS=$(grep -r "from.*storage" src/components src/features --include="*.tsx" --include="*.ts" | grep -v "test")

if [ ! -z "$STORAGE_LEAKS" ]; then
    echo -e "${RED}❌ VIOLATION: Storage layer imported in UI components (Use hooks instead):${NC}"
    echo "$STORAGE_LEAKS"
    VIOLATIONS=$((VIOLATIONS+1))
else
    echo -e "${GREEN}✅ OK: No direct Storage access in UI.${NC}"
fi

echo -e "\n-----------------------------------"
if [ $VIOLATIONS -eq 0 ]; then
    echo -e "${GREEN}🎉 Architecture verification PASSED!${NC}"
    exit 0
else
    echo -e "${RED}💥 Architecture verification FAILED with $VIOLATIONS violations.${NC}"
    exit 1
fi
