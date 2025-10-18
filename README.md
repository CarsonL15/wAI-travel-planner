# wAI Travel Planner

AI-powered personalized travel itinerary generator built for hackathon.

## Architecture

- **Frontend**: Next.js + TypeScript with Amplify Auth
- **Backend**: AWS Lambda + AppSync GraphQL + DynamoDB
- **AI**: Amazon Bedrock (Claude) for itinerary generation
- **Tools**: Custom MCP server for contextual helpers
- **Infrastructure**: AWS Amplify with CDK

## Repository Structure

```
wAI-travel-planner/
├── web/                    # Next.js frontend
├── backend/                # Lambda functions + GraphQL schema
├── mcp-server/            # Express server for contextual tools
└── package.json           # Root workspace configuration
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- AWS CLI configured
- AWS Amplify CLI installed

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp env.example .env
   # Edit .env with your AWS credentials and configuration
   ```

3. **Start development servers**:
   ```bash
   # Start all services
   npm run dev
   
   # Or start individually:
   cd web && npm run dev          # Next.js on :3000
   cd mcp-server && npm run dev   # MCP server on :3001
   ```

### AWS Setup

1. **Initialize Amplify**:
   ```bash
   amplify init
   amplify add auth
   amplify add api
   amplify add storage
   amplify push
   ```

2. **Configure services**:
   - Cognito User Pool for authentication
   - AppSync GraphQL API
   - DynamoDB table with single-table design
   - Lambda functions for business logic
   - Bedrock access for AI generation

### Development

- **Frontend**: `http://localhost:3000`
- **MCP Server**: `http://localhost:3001`
- **GraphQL Playground**: Available in AWS AppSync console

## Core Features

### User Flow
1. **Authentication** → Cognito sign-in/sign-up
2. **Profile Setup** → Interests, travel style, budget, constraints
3. **Itinerary Generation** → AI-powered with Bedrock
4. **Feedback Loop** → Thumbs up/down for activity refinement

### Data Model (DynamoDB)
- `USER#{userId}, SK=PROFILE` → User profile
- `USER#{userId}, SK=ITIN#{itineraryId}` → Itinerary metadata
- `ITIN#{itineraryId}, SK=DAY#{date}` → Daily plans
- `ITIN#{itineraryId}, SK=EVENT#{timestamp}` → User feedback

### AI Integration
- **Bedrock Model**: Claude 3 Sonnet
- **JSON Schema**: Strict validation for consistent output
- **Context Awareness**: Seasonal hints, local insights
- **Retry Logic**: Auto-retry on invalid JSON responses

## API Endpoints

### GraphQL (AppSync)
- `getProfile(userId)` → User profile
- `listItineraries(userId)` → User's itineraries
- `generateItinerary(input)` → Create new itinerary
- `rateActivity(input)` → Provide feedback

### MCP Server
- `GET /places?query&lat&lon` → Search places
- `GET /context?destination&month` → Seasonal context

## Deployment

### Frontend (Amplify Hosting)
```bash
amplify publish
```

### Backend (Lambda + AppSync)
```bash
amplify push
```

## Development Notes

- All code uses TypeScript with strict mode
- ESLint + Prettier for code formatting
- Mock data available for immediate development
- TODO comments mark implementation points
- Focus on demo-ready features over production polish

## Next Steps

1. Implement actual AWS service connections
2. Add real Bedrock integration
3. Implement user feedback system
4. Add real-time updates with subscriptions
5. Enhance UI/UX for demo presentation