#!/bin/bash

echo "🚀 Starting deployment process..."

# Step 1: Build Next.js app
echo "📦 Building Next.js app..."
cd web
npm run build
cd ..

# Step 2: Deploy with CDK
echo "☁️  Deploying to AWS..."
cd infrastructure
npm run cdk deploy
cd ..

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app is now live on AWS!"
echo "Check the CDK output for your website URL"
