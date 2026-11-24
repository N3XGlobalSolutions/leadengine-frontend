#!/usr/bin/env bash

# ============================================================
# Deploy Frontend → DEV (test.qbotglobal.com)
#
# S3: test-frontend-leadengine
# CloudFront: E1J2SJ71GOHVOA
# ============================================================

set -Eeuo pipefail

export PATH="$HOME/.cargo/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

FRONTEND_DIR="$(cd "$(dirname "$0")" && pwd)"
REGION="ap-south-1"
S3_BUCKET="test-frontend-leadengine"
CF_DIST_ID="E1J2SJ71GOHVOA"
export AWS_PROFILE="${AWS_PROFILE:-leadengine}"

echo "========================================="
echo "🚀 QBot DEV Frontend Deployment"
echo "========================================="

# ---------- Helper ----------
check_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "❌ Missing required command: $1"
    exit 1
  }
}

# ---------- Pre-flight Checks ----------
check_command aws
check_command npm
check_command git

cd "$FRONTEND_DIR"

if [ -d ".git" ]; then
  echo "🔧 Branch: $(git branch --show-current)"
fi

echo ""
read -p "Deploy DEV frontend to test.qbotglobal.com? (y/N): " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "❌ Deployment cancelled"
  exit 0
fi

echo ""
echo "⚠️ Preparing environment..."

if [ -f ".env.development.local" ]; then
  mv .env.development.local .env.development.local.bak
  echo "✅ Temporarily disabled .env.development.local"
fi

cleanup() {
  if [ -f ".env.development.local.bak" ]; then
    mv .env.development.local.bak .env.development.local
    echo "✅ Restored .env.development.local"
  fi
}

trap cleanup EXIT

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🏗️ Building frontend..."
npm run build -- --mode production

echo ""
echo "☁️ Uploading to S3..."
aws s3 sync dist/ "s3://$S3_BUCKET" --delete --region "$REGION"

echo ""
echo "🔄 Invalidating CloudFront..."
aws cloudfront create-invalidation \
  --distribution-id "$CF_DIST_ID" \
  --paths "/*" \
  --no-cli-pager

echo ""
echo "========================================="
echo "✅ Deployment successful"
echo "🌐 https://test.qbotglobal.com"
echo "☁️ CloudFront Distribution: $CF_DIST_ID"
echo "📦 S3 Bucket: $S3_BUCKET"
echo "⏳ CloudFront propagation usually takes 1-5 minutes"
echo "========================================="
