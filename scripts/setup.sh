#!/bin/bash
# ============================================================
# Directory Master — First-Run Setup Script
# ============================================================
# Run this once after cloning the repository into Replit
# (or any fresh environment) before starting the app.
#
# Usage:
#   bash scripts/setup.sh
# ============================================================

set -e

echo ""
echo "=================================================="
echo "  Directory Master — Setup"
echo "=================================================="
echo ""

# 1. Check for required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo ""
  echo "On Replit: go to Tools → Database and add a PostgreSQL database."
  echo "Replit will set DATABASE_URL automatically as a Secret."
  echo ""
  exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
  echo "WARNING: SESSION_SECRET is not set."
  echo ""
  echo "Generating a temporary SESSION_SECRET for this session..."
  export SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
  echo "  Temporary value: $SESSION_SECRET"
  echo ""
  echo "ACTION REQUIRED: Save this as a permanent Secret in Replit:"
  echo "  Tools → Secrets → Add Secret → Name: SESSION_SECRET"
  echo ""
fi

# 2. Install dependencies
echo "Step 1/2 — Installing dependencies..."
pnpm install --frozen-lockfile
echo "  Done."
echo ""

# 3. Push database schema
echo "Step 2/2 — Pushing database schema..."
pnpm --filter @workspace/db run push
echo "  Done."
echo ""

echo "=================================================="
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Ensure SESSION_SECRET is set as a permanent Secret"
echo "  2. (Optional) Set GEMINI_API_KEY for AI-powered CSV import"
echo "  3. Click Run / start the workflows"
echo "  4. Open your app and complete the setup wizard at /setup"
echo "     to create your admin account and configure your directory"
echo "=================================================="
echo ""
