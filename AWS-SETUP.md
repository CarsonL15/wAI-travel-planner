# wAI Travel Planner - AWS Setup Complete! 🎉

## What's Been Set Up

### AWS Resources (via CDK)
- ✅ **Cognito User Pool** - Authentication
- ✅ **DynamoDB Table** (`wai-travel`) - Database  
- ✅ **Lambda Functions** - Backend logic
  - `generateItinerary` - AI-powered itinerary generation with Bedrock
  - `getItinerary` - Fetch itinerary by ID
  - `getUser` - Get user profile
- ✅ **API Gateway** - REST API
- ✅ **S3 Bucket** - Static website hosting

### Frontend Files Created
- ✅ `web/lib/auth.ts` - Cognito authentication helpers
- ✅ `web/lib/api.ts` - API client for backend
- ✅ `web/pages/login.tsx` - Login/signup page

## How to Use

### 1. Start the Development Server
```bash
cd web
npm run dev
```

### 2. Test the Flow
1. Go to http://localhost:3000/login
2. **Sign Up** with your email
3. Check your email for verification code
4. Confirm your email with the code
5. **Sign In** with your credentials
6. Navigate to trip preferences
7. Fill out the form and click "Generate Itinerary"
8. Watch as AWS Bedrock generates your itinerary!

### 3. View Your AWS Resources
- **Cognito**: https://console.aws.amazon.com/cognito/v2/idp/user-pools?region=us-east-1
- **DynamoDB**: https://console.aws.amazon.com/dynamodbv2/home?region=us-east-1#tables
- **Lambda**: https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions
- **API Gateway**: https://console.aws.amazon.com/apigateway/main/apis?region=us-east-1

## Environment Variables

Your `.env.local` is configured with:
```
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=us-east-1_LdnzkM7Be
NEXT_PUBLIC_USER_POOL_CLIENT_ID=49fb1vcbp53gppilpj815sphhe
NEXT_PUBLIC_API_URL=https://5sjdozoj68.execute-api.us-east-1.amazonaws.com/prod/
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDm2sNolJpQmP2chWSv7VdVtBaqOmz-sVA
```

## Deploying Updates

### Update Backend (Lambda functions)
```bash
cd infrastructure
npx cdk deploy
```

### Deploy Frontend to S3
```bash
cd web
npm run build
# Uncomment the S3 deployment in infrastructure/lib/wai-travel-stack.ts
cd ../infrastructure
npx cdk deploy
```

## Troubleshooting

### "Not authenticated" errors
- Make sure you're signed in at `/login`
- Check browser console for errors
- Verify JWT token in localStorage: `localStorage.getItem('idToken')`

### Lambda timeout
- Bedrock can take 30-60 seconds for complex itineraries
- Default timeout is 5 minutes (should be enough)

### Cognito email not arriving
- Check spam folder
- Make sure email is valid
- Cognito free tier: 50,000 MAUs (monthly active users)

## Next Steps

- [ ] Add feedback buttons to itinerary blocks
- [ ] Implement real-time itinerary updates
- [ ] Add Google Maps integration for location display
- [ ] Store user preferences in DynamoDB
- [ ] Add past itineraries list

## Costs

**Expected monthly cost: $0-$10**
- Cognito: Free (50K MAUs)
- DynamoDB: Free (25 GB storage)
- Lambda: Free (1M requests/month)
- API Gateway: Free first year (1M requests/month)
- Bedrock: ~$0.003 per 1K tokens (THIS WILL COST MONEY)
- S3: Free (5 GB storage)

## Architecture

```
User Browser
    ↓
Next.js App (localhost:3000)
    ↓
API Gateway (https://5sjdozoj68.execute-api.us-east-1.amazonaws.com/prod/)
    ↓
Lambda Functions
    ↓
- Bedrock (AI generation)
- DynamoDB (storage)
- Cognito (auth)
```

---

Built with ❤️ using AWS CDK, Next.js, and Claude 3 Sonnet
