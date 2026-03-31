#!/bin/bash
# setup.sh - Automatic local development setup for Linux/Mac

echo "╔════════════════════════════════════════╗"
echo "║   BI-HUB LOCAL SETUP                   ║"
echo "║   Automatic Environment Configuration  ║"
echo "╚════════════════════════════════════════╝"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check Python
echo -e "\n${YELLOW}[1/6] Checking Python...${NC}"
if command -v python3 &> /dev/null; then
    python_version=$(python3 --version)
    echo -e "${GREEN}✅ Found: $python_version${NC}"
    python_path=$(which python3)
    echo -e "${BLUE}   Path: $python_path${NC}"
else
    echo -e "${RED}❌ Python 3 not found!${NC}"
    echo -e "${YELLOW}   Install with: brew install python (Mac) or apt-get install python3 (Linux)${NC}"
    exit 1
fi

# Step 2: Check Node.js
echo -e "\n${YELLOW}[2/6] Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    node_version=$(node --version)
    echo -e "${GREEN}✅ Found: $node_version${NC}"
    npm_version=$(npm --version)
    echo -e "${BLUE}   npm: $npm_version${NC}"
else
    echo -e "${RED}❌ Node.js not found!${NC}"
    echo -e "${YELLOW}   Install from: https://nodejs.org/ or brew install node${NC}"
    exit 1
fi

# Step 3: Create virtual environment
echo -e "\n${YELLOW}[3/6] Setting up Python virtual environment...${NC}"
if [ -d "venv" ]; then
    echo -e "${GREEN}✅ Virtual environment exists${NC}"
else
    echo -e "${BLUE}   Creating venv...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
fi

# Step 4: Activate venv and install Python dependencies
echo -e "\n${YELLOW}[4/6] Installing Python dependencies...${NC}"
source venv/bin/activate
echo -e "${BLUE}   (venv) activated${NC}"

if [ -f "requirements.txt" ]; then
    echo -e "${BLUE}   Installing from requirements.txt...${NC}"
    pip install -r requirements.txt -q
    echo -e "${GREEN}✅ Python dependencies installed${NC}"
else
    echo -e "${RED}❌ requirements.txt not found!${NC}"
    exit 1
fi

# Step 5: Install Node dependencies
echo -e "\n${YELLOW}[5/6] Installing Node.js dependencies...${NC}"
if [ -f "frontend/package.json" ]; then
    cd frontend
    echo -e "${BLUE}   Running npm install in frontend/...${NC}"
    npm install --silent
    cd ..
    echo -e "${GREEN}✅ Node dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  frontend/package.json not found (optional)${NC}"
fi

# Step 6: Create .env file
echo -e "\n${YELLOW}[6/6] Setting up environment variables...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    echo -e "${BLUE}   (Review and update if needed)${NC}"
else
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env from .env.example${NC}"
        echo -e "${BLUE}   Review contents and update if needed${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example not found${NC}"
        echo -e "${BLUE}   Create .env manually with required variables:${NC}"
        echo -e "${BLUE}   - SECRET_KEY${NC}"
        echo -e "${BLUE}   - ADMIN_DEFAULT_PASSWORD${NC}"
        echo -e "${BLUE}   - ADMIN_DEFAULT_EMAIL${NC}"
    fi
fi

# Success message
echo -e "\n${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ SETUP COMPLETE!                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}📚 Next Steps:${NC}"
echo -e "Open 2 terminal windows/tabs:\n"

echo -e "${YELLOW}Terminal 1 - Backend:${NC}"
echo -e "${BLUE}  source venv/bin/activate${NC}"
echo -e "${BLUE}  python -m uvicorn main:app --reload${NC}"
echo -e ""

echo -e "${YELLOW}Terminal 2 - Frontend:${NC}"
echo -e "${BLUE}  cd frontend${NC}"
echo -e "${BLUE}  npm run dev${NC}"
echo -e ""

echo -e "Then open: ${YELLOW}http://localhost:5173${NC}"
echo -e "\n${BLUE}📖 For detailed help, see: LOCAL_SETUP.md${NC}"
echo -e ""
