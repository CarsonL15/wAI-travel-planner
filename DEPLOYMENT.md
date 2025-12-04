# 🚀 AWS Deployment Guide

## Overview
Your Next.js app will be hosted as a static website on S3, with CloudFront CDN coming from the CDK deployment.

## Architecture
- **Frontend**: Next.js static site hosted on S3
- **Backend**: API Gateway + Lambda (already deployed ✅)
- **Auth**: Cognito (already deployed ✅)
- **Database**: DynamoDB (already deployed ✅)
- **AI**: Bedrock Claude 3 Sonnet (already configured ✅)

## Quick Deploy

### Option 1: One-Command Deploy 🎯
```bash
./deploy.sh
```

### Option 2: Manual Deploy (Step-by-Step)

#### Step 1: Build Next.js App
```bash
cd web
npm run build
```
This creates the `web/out` directory with static HTML/CSS/JS files.

#### Step 2: Deploy Infrastructure
```bash
cd ../infrastructure
npm run cdk deploy
```
This will:
- Update your S3 bucket
- Upload the `web/out` files to S3
- Configure S3 for static website hosting
- Output your website URL

#### Step 3: Get Your Website URL
After deployment, look for the output:
```
Outputs:
WaiTravelStack.WebsiteUrl = http://wai-travel-website-xxxxx.s3-website-us-east-1.amazonaws.com
```

## Environment Variables

Your `.env.local` variables are embedded during the build process (prefixed with `NEXT_PUBLIC_`):
- ✅ `NEXT_PUBLIC_USER_POOL_ID`
- ✅ `NEXT_PUBLIC_USER_POOL_CLIENT_ID`
- ✅ `NEXT_PUBLIC_API_URL`
- ✅ `NEXT_PUBLIC_AWS_REGION`
- ✅ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

These are baked into the static files during `npm run build`.

## Post-Deployment

### Test Your Live Site
1. Open the S3 website URL from CDK output
2. Create a new account
3. Set your travel preferences
4. Generate an itinerary
5. Verify it shows up!

### Custom Domain (Optional)
To use your own domain like `wai-travel.com`:

1. **Add CloudFront Distribution** (update your CDK stack):
```typescript
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

const distribution = new cloudfront.Distribution(this, 'Distribution', {
  defaultBehavior: {
    origin: new origins.S3Origin(websiteBucket),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  },
  defaultRootObject: 'index.html',
  errorResponses: [
    {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
    },
  ],
});
```

2. **Add your domain** in Route 53
3. **Get SSL certificate** from AWS Certificate Manager
4. **Update distribution** to use custom domain

## Updating Your App

Every time you make changes:

```bash
# Quick update
./deploy.sh

# Or manually
cd web && npm run build && cd ../infrastructure && npm run cdk deploy
```

## Cost Estimate 💰

With AWS Free Tier:
- **S3 Hosting**: ~$0.50/month (for small traffic)
- **API Gateway**: Free tier covers 1M requests/month
- **Lambda**: Free tier covers 1M requests/month
- **DynamoDB**: Free tier covers 25GB storage
- **Cognito**: Free for first 50,000 users
- **Bedrock**: ~$0.003 per 1K input tokens (~$0.015 per itinerary)

**Estimated cost for 1,000 itineraries/month**: ~$20-30

## Monitoring

Check your deployment status:
```bash
aws cloudformation describe-stacks --stack-name WaiTravelStack --region us-east-1
```

View S3 bucket:
```bash
aws s3 ls s3://wai-travel-website-xxxxx/
```

## Troubleshooting

### Issue: "Cannot find module '../web/out'"
**Solution**: Run `cd web && npm run build` first

### Issue: Website shows blank page
**Solution**: Check browser console. Likely CORS or API URL issue.

### Issue: Login doesn't work
**Solution**: Verify Cognito IDs in `.env.local` match deployed values

### Issue: API calls fail
**Solution**: Check API Gateway URL in `.env.local` matches deployed API

## Next Steps

1. **Add CloudFront** for HTTPS and better performance
2. **Add custom domain** with Route 53
3. **Set up CI/CD** with GitHub Actions
4. **Add monitoring** with CloudWatch
5. **Enable logging** for debugging

---

🎉 **You're live on AWS!**
