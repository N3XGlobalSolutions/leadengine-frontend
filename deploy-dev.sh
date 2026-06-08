#!/bin/bash

# ============================================================

# Deploy Frontend → DEV (test.qbotglobal.com)

# S3: test.qbotglobal.com

# CloudFront: E1BW6DMY5JCEBV

# ============================================================

set -e

export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"

FRONTEND_DIR="$(cd "$(dirname "$0")" && pwd)"
REGION="us-east-1"
S3_BUCKET="test.qbotglobal.com"
CF_DIST_ID="E1BW6DMY5JCEBV"

echo "========================================="
echo "🚀 QBot DEV Frontend Deployment"
echo "========================================="

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
npm run build -- --mode development

echo ""
echo "☁️ Uploading to S3..."

aws s3 sync dist/ "s3://$S3_BUCKET" --delete --region "$REGION"
echo "hf"
echo "🔄 Invalidating CloudFront..."
aws cloudfront create-invalidation --distribution-id E1BW6DMY5JCEBV --paths "/*"

echo ""
echo "========================================="
echo "✅ Deployment successful"
echo "🌐 https://test.qbotglobal.com"
echo "☁️ CloudFront Distribution: $CF_DIST_ID"
echo "📦 S3 Bucket: $S3_BUCKET"
echo "⏳ CloudFront propagation usually takes 1-5 minutes"
echo "========================================="
