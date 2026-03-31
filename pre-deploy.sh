#!/bin/bash
# pre-deploy.sh — Security validation before deployment

set -e

echo "════════════════════════════════════════════════════════"
echo "🔒 PBI HUB — PRE-DEPLOYMENT SECURITY CHECK"
echo "════════════════════════════════════════════════════════"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CHECKS_PASSED=0
CHECKS_FAILED=0

# Check 1: SECRET_KEY configured
echo ""
echo "1️⃣  Checking SECRET_KEY..."
if [ -z "$SECRET_KEY" ] && [ -z "$RENDER_GIT_COMMIT" ]; then
    echo -e "${YELLOW}⚠️  SECRET_KEY not set in env (OK if on Render - auto-generated)${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED+1))
elif [ ! -z "$SECRET_KEY" ]; then
    if [ ${#SECRET_KEY} -lt 20 ]; then
        echo -e "${RED}❌ SECRET_KEY too short (min 20 chars)${NC}"
        CHECKS_FAILED=$((CHECKS_FAILED+1))
    else
        echo -e "${GREEN}✅ SECRET_KEY configured (length: ${#SECRET_KEY})${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED+1))
    fi
else
    echo -e "${GREEN}✅ Running on Render (auto-generates SECRET_KEY)${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED+1))
fi

# Check 2: No hardcoded credentials in code
echo ""
echo "2️⃣  Checking for hardcoded credentials..."
if grep -r "admin123\|dev-only\|password123" --include="*.py" app/ main.py 2>/dev/null; then
    echo -e "${RED}❌ Found hardcoded credentials in code!${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED+1))
else
    echo -e "${GREEN}✅ No hardcoded credentials found${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED+1))
fi

# Check 3: .env file not committed
echo ""
echo "3️⃣  Checking .env handling..."
if [ -f ".env" ]; then
    if git ls-files --cached .env 2>/dev/null | grep -q .env; then
        echo -e "${RED}❌ .env file is tracked in git!${NC}"
        CHECKS_FAILED=$((CHECKS_FAILED+1))
    else
        echo -e "${YELLOW}⚠️  .env exists but not tracked (good)${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED+1))
    fi
else
    echo -e "${GREEN}✅ No .env file (using env variables)${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED+1))
fi

# Check 4: Requirements.txt up to date
echo ""
echo "4️⃣  Checking dependencies..."
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}✅ requirements.txt found${NC}"
    if grep -q "fastapi\|sqlalchemy\|pydantic" requirements.txt; then
        echo -e "${GREEN}✅ Core dependencies present${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED+1))
    else
        echo -e "${RED}❌ Missing core dependencies${NC}"
        CHECKS_FAILED=$((CHECKS_FAILED+1))
    fi
else
    echo -e "${RED}❌ requirements.txt not found${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED+1))
fi

# Check 5: Build script exists
echo ""
echo "5️⃣  Checking build configuration..."
if [ -f "build.sh" ]; then
    echo -e "${GREEN}✅ build.sh found${NC}"
    if [ -x "build.sh" ]; then
        echo -e "${GREEN}✅ build.sh is executable${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED+1))
    else
        echo -e "${YELLOW}⚠️  build.sh not executable (will be executed anyway)${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED+1))
    fi
else
    echo -e "${RED}❌ build.sh not found${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED+1))
fi

# Check 6: Database migration ready
echo ""
echo "6️⃣  Checking database setup..."
if grep -q "bootstrap()" main.py; then
    echo -e "${GREEN}✅ Database bootstrap configured${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED+1))
else
    echo -e "${RED}❌ Database bootstrap not configured${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED+1))
fi

# Check 7: Security headers middleware
echo ""
echo "7️⃣  Checking security headers..."
if grep -q "SecurityHeadersMiddleware\|X-Content-Type-Options" main.py; then
    echo -e "${GREEN}✅ Security headers configured${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED+1))
else
    echo -e "${RED}❌ Security headers not configured${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED+1))
fi

# Check 8: CORS configured
echo ""
echo "8️⃣  Checking CORS configuration..."
if grep -q "CORSMiddleware\|allow_origins" main.py; then
    echo -e "${GREEN}✅ CORS configured${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED+1))
else
    echo -e "${RED}❌ CORS not configured${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED+1))
fi

# Check 9: Rate limiting
echo ""
echo "9️⃣  Checking rate limiting..."
if grep -q "rate_limit\|RATE_LIMIT" app/routes.py; then
    echo -e "${GREEN}✅ Rate limiting configured${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED+1))
else
    echo -e "${RED}❌ Rate limiting not configured${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED+1))
fi

# Check 10: Strong password validation
echo ""
echo "🔟 Checking password validation..."
if grep -q "validate_password_strength\|special character" app/routes.py; then
    echo -e "${GREEN}✅ Strong password validation configured${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED+1))
else
    echo -e "${RED}❌ Weak password validation${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED+1))
fi

# Summary
echo ""
echo "════════════════════════════════════════════════════════"
echo "📊 SECURITY CHECK SUMMARY"
echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}❌ Failed: $CHECKS_FAILED${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ ALL CHECKS PASSED - READY TO DEPLOY${NC}"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ FAILED CHECKS - FIX ISSUES BEFORE DEPLOYING${NC}"
    echo ""
    exit 1
fi
