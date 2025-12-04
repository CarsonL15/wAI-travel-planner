# wAI Travel Planner - Complete Project Documentation

> **AI-Powered Personalized Travel Itinerary Generator**
> Built with Next.js, AWS Lambda, DynamoDB, and Amazon Bedrock (Claude 3 Sonnet)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Infrastructure (AWS CDK)](#6-infrastructure-aws-cdk)
7. [Data Model](#7-data-model)
8. [API Reference](#8-api-reference)
9. [Authentication Flow](#9-authentication-flow)
10. [AI Integration](#10-ai-integration)
11. [User Flow](#11-user-flow)
12. [How to Edit Each Part](#12-how-to-edit-each-part)
13. [Development Guide](#13-development-guide)
14. [Deployment](#14-deployment)
15. [Where to Go From Here](#15-where-to-go-from-here)

---

## 1. Project Overview

The **wAI Travel Planner** is a full-stack AI-powered travel planning application that generates personalized travel itineraries based on user preferences. Users can:

- Create an account and specify their travel interests (hiking, food, museums, etc.)
- Set their travel style (luxury, budget, backpacker) and pace (relaxed, fast-paced)
- Select a destination from an interactive world map
- Generate AI-powered day-by-day itineraries with activities, times, and costs
- View detailed itineraries with packing lists and daily rationale

### Key Features

| Feature | Status | Description |
|---------|--------|-------------|
| User Authentication | ✅ Complete | Cognito-based signup/login/logout |
| Travel Preferences | ✅ Complete | Interests, style, pace collection |
| Interactive Map | ✅ Complete | Leaflet world map with country selection |
| AI Itinerary Generation | ✅ Complete | Claude 3 Sonnet via Bedrock |
| Itinerary Display | ✅ Complete | Day-by-day activities view |
| User Feedback | 🔄 Partial | Thumbs up/down system planned |
| Custom Domain | ❌ Not Started | HTTPS with CloudFront |

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2 | React framework with static export |
| React | 18.2 | UI component library |
| TypeScript | 5.1+ | Type safety |
| Tailwind CSS | 4.1 | Utility-first styling |
| Leaflet | 1.9 | Interactive maps |
| react-leaflet | 5.0 | React Leaflet components |
| amazon-cognito-identity-js | 6.3 | Cognito authentication |

### Backend
| Technology | Purpose |
|------------|---------|
| AWS Lambda | Serverless function execution |
| Node.js 20.x | Lambda runtime |
| DynamoDB | NoSQL database |
| Amazon Bedrock | AI model (Claude 3 Sonnet) |
| API Gateway | REST API endpoints |
| Cognito | User authentication |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| AWS CDK | Infrastructure as code |
| S3 | Static website hosting |
| CloudFormation | AWS resource provisioning |

---

## 3. Project Structure

```
wAI-travel-planner/
│
├── web/                          # 🌐 FRONTEND (Next.js)
│   ├── pages/                    # Route pages
│   │   ├── _app.tsx              # App wrapper with providers
│   │   ├── index.tsx             # Landing page (map + auth)
│   │   ├── trip-preferences.tsx  # Trip planning form
│   │   └── itinerary/[id].tsx    # Itinerary display
│   ├── components/               # Reusable components
│   │   └── LeafletWorldMap.tsx   # Interactive world map
│   ├── lib/                      # Utilities
│   │   ├── api.ts                # API client functions
│   │   └── auth.ts               # Cognito auth utilities
│   ├── context/                  # React Context
│   │   └── UserContext.tsx       # Global user state
│   ├── styles/                   # CSS
│   │   └── globals.css           # Global styles
│   ├── package.json              # Frontend dependencies
│   ├── next.config.js            # Next.js configuration
│   ├── tailwind.config.js        # Tailwind CSS config
│   └── .env.local                # Environment variables
│
├── backend/                      # ⚡ BACKEND (Lambda)
│   └── functions/                # Lambda handlers
│       ├── generateItinerary.ts  # AI itinerary generation
│       ├── getItinerary.ts       # Fetch itinerary
│       ├── getUser.ts            # Get user profile
│       └── saveUserPreferences.ts # Save preferences
│
├── infrastructure/               # 🏗️ AWS CDK STACK
│   ├── bin/app.ts                # CDK app entrypoint
│   ├── lib/wai-travel-stack.ts   # Main stack definition
│   ├── cdk.json                  # CDK configuration
│   ├── package.json              # CDK dependencies
│   └── cdk.out/                  # Generated CloudFormation
│
├── package.json                  # Root monorepo config
├── tsconfig.json                 # Root TypeScript config
├── deploy.sh                     # Deployment script
├── README.md                     # Quick start guide
└── DEPLOYMENT.md                 # AWS deployment guide
```

---

## 4. Frontend Architecture

### Pages (Routes)

#### `pages/_app.tsx`
- **Purpose**: Root application wrapper
- **Key Functionality**: Wraps all pages with `UserProvider` for global state
- **Edit when**: Adding new global providers, layouts, or app-wide functionality

#### `pages/index.tsx` (Landing Page)
- **Purpose**: Main landing page with map and authentication
- **Size**: ~1,085 lines (largest file)
- **Key Features**:
  - Interactive Leaflet world map
  - Login modal
  - Sign-up modal (multi-step)
  - Auth prompt modal
  - Country selection
- **Edit when**: Changing the homepage UI, modifying auth flow, updating map behavior

#### `pages/trip-preferences.tsx`
- **Purpose**: Trip planning form
- **Key Features**:
  - Destination input
  - Duration selection (1-14 days)
  - Budget selection (low/medium/high)
  - Start date picker
  - Calls `generateItinerary` API
- **Edit when**: Adding new trip parameters, changing form validation

#### `pages/itinerary/[id].tsx`
- **Purpose**: Display generated itinerary
- **Key Features**:
  - Day-by-day breakdown
  - Activity cards with times, costs, addresses
  - Packing list display
  - Daily rationale
- **Edit when**: Changing itinerary display format, adding activity interactions

### Components

#### `components/LeafletWorldMap.tsx`
- **Purpose**: Interactive world map component
- **Technology**: Leaflet + react-leaflet
- **Key Features**:
  - World map display
  - Country hover effects
  - Click-to-select functionality
- **Edit when**: Changing map styling, adding new map interactions

### Libraries

#### `lib/api.ts`
- **Purpose**: API client functions
- **Functions**:
  ```typescript
  generateItinerary(params) → Itinerary  // Create new itinerary
  getItinerary(id) → Itinerary           // Fetch existing itinerary
  getUser() → User                        // Get current user
  ```
- **Edit when**: Adding new API endpoints, modifying request/response handling

#### `lib/auth.ts`
- **Purpose**: Cognito authentication utilities
- **Functions**:
  ```typescript
  signUp(email, password, name) → void   // Register new user
  confirmSignUp(email, code) → void      // Verify email
  signIn(email, password) → JWT          // Login
  signOut() → void                        // Logout
  getCurrentUser() → User                 // Get authenticated user
  ```
- **Edit when**: Modifying auth flow, adding OAuth providers

### Context

#### `context/UserContext.tsx`
- **Purpose**: Global user state management
- **Provides**:
  - `user`: Current user object
  - `setUser`: Update user
  - `isAuthenticated`: Auth status
  - `logout`: Sign out function
- **Features**: localStorage persistence
- **Edit when**: Adding new global state, modifying user data structure

### Environment Variables (`web/.env.local`)

```env
NEXT_PUBLIC_USER_POOL_ID=         # Cognito User Pool ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=  # Cognito Client ID
NEXT_PUBLIC_API_URL=              # API Gateway URL
NEXT_PUBLIC_AWS_REGION=           # AWS region (us-east-1)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=  # Optional: Google Maps key
```

---

## 5. Backend Architecture

### Lambda Functions

#### `functions/generateItinerary.ts` ⭐ (Core Function)
- **Purpose**: Generate AI-powered itineraries
- **Flow**:
  1. Receive authenticated request
  2. Fetch user preferences from DynamoDB
  3. Build personalized prompt
  4. Call Bedrock (Claude 3 Sonnet)
  5. Parse and validate JSON response
  6. Save itinerary to DynamoDB
  7. Return itinerary to client
- **Edit when**: Modifying AI prompt, changing itinerary structure, adding validation

#### `functions/getItinerary.ts`
- **Purpose**: Retrieve existing itinerary
- **Flow**:
  1. Extract itinerary ID from path
  2. Query DynamoDB
  3. Return itinerary data
- **Edit when**: Adding access control, modifying response format

#### `functions/getUser.ts`
- **Purpose**: Get current user profile
- **Flow**:
  1. Extract user ID from Cognito claims
  2. Query DynamoDB for user profile
  3. Return user data
- **Edit when**: Adding new user fields, modifying profile structure

#### `functions/saveUserPreferences.ts`
- **Purpose**: Save travel preferences
- **Expected Payload**:
  ```json
  {
    "interests": ["hiking", "food", "museums"],
    "travelStyle": "balanced",
    "pace": "moderate"
  }
  ```
- **Edit when**: Adding new preference fields

---

## 6. Infrastructure (AWS CDK)

### Main Stack: `lib/wai-travel-stack.ts`

This file defines ALL AWS resources for the application:

#### Resources Created

| Resource | Type | Purpose |
|----------|------|---------|
| `wai-travel-users` | Cognito User Pool | User authentication |
| `wai-travel-users-client` | Cognito Client | Frontend auth integration |
| `wai-travel` | DynamoDB Table | Data storage |
| `generateItinerary` | Lambda Function | AI itinerary generation |
| `getItinerary` | Lambda Function | Fetch itinerary |
| `getUser` | Lambda Function | Get user profile |
| `saveUserPreferences` | Lambda Function | Save preferences |
| `wai-travel-api` | API Gateway | REST API endpoints |
| `wai-travel-web` | S3 Bucket | Static website hosting |

#### CDK Stack Structure

```typescript
// Cognito User Pool
const userPool = new cognito.UserPool(this, 'wai-travel-users', {...});

// DynamoDB Table
const table = new dynamodb.Table(this, 'wai-travel', {
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
});

// Lambda Functions
const generateItineraryFn = new lambda.Function(this, 'generateItinerary', {...});

// API Gateway
const api = new apigateway.RestApi(this, 'wai-travel-api', {...});
```

**Edit when**: Adding new AWS resources, modifying Lambda configs, changing API routes

---

## 7. Data Model

### DynamoDB Single-Table Design

The application uses a single-table design with composite keys:

| PK (Partition Key) | SK (Sort Key) | Item Type | Fields |
|--------------------|---------------|-----------|--------|
| `USER#<userId>` | `PROFILE` | User Profile | userId, email, interests[], travelStyle, pace, createdAt |
| `USER#<userId>` | `ITIN#<id>` | User's Itinerary | id, destination, startDate, endDate, days[], packingList[] |
| `ITIN#<id>` | `DAY#<date>` | Day Details | date, blocks[] |
| `ITIN#<id>` | `EVENT#<ts>` | Feedback Event | type, rating, activityId |

### User Profile Schema
```typescript
interface UserProfile {
  PK: `USER#${userId}`;
  SK: 'PROFILE';
  userId: string;
  email: string;
  name: string;
  interests: string[];       // ['hiking', 'food', 'museums', ...]
  travelStyle: string;       // 'luxury' | 'balanced' | 'budget' | 'backpacker'
  pace: string;              // 'relaxed' | 'moderate' | 'fast-paced'
  createdAt: string;
  updatedAt: string;
}
```

### Itinerary Schema
```typescript
interface Itinerary {
  PK: `USER#${userId}`;
  SK: `ITIN#${itineraryId}`;
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: Day[];
  packingList: string[];
  rationalePerDay: string[];
}

interface Day {
  date: string;
  blocks: Activity[];
}

interface Activity {
  id: string;
  start: string;           // "09:00"
  end: string;             // "11:00"
  title: string;
  category: 'food' | 'museum' | 'outdoors' | 'shopping' | 'other';
  costBand: 'low' | 'med' | 'high';
  notes: string;
  address: string;
}
```

---

## 8. API Reference

### Base URL
```
https://<api-id>.execute-api.us-east-1.amazonaws.com/prod
```

### Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: <jwt-token>
```

### Endpoints

#### Create Itinerary
```http
POST /itineraries
Content-Type: application/json

{
  "destination": "Tokyo, Japan",
  "duration": 7,
  "budget": "medium",
  "startDate": "2024-03-15"
}

Response: 201 Created
{
  "id": "itin-uuid",
  "destination": "Tokyo, Japan",
  "startDate": "2024-03-15",
  "endDate": "2024-03-22",
  "days": [...],
  "packingList": [...],
  "rationalePerDay": [...]
}
```

#### Get Itinerary
```http
GET /itineraries/{id}

Response: 200 OK
{
  "id": "itin-uuid",
  "destination": "Tokyo, Japan",
  ...
}
```

#### Get User
```http
GET /user

Response: 200 OK
{
  "userId": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "interests": ["hiking", "food"],
  "travelStyle": "balanced",
  "pace": "moderate"
}
```

#### Save Preferences
```http
POST /user/preferences
Content-Type: application/json

{
  "interests": ["hiking", "food", "museums"],
  "travelStyle": "balanced",
  "pace": "moderate"
}

Response: 200 OK
```

---

## 9. Authentication Flow

### Sign Up Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                         USER SIGN UP                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User enters email, password, name                           │
│     └─► signUp() → Cognito creates unverified user              │
│                                                                  │
│  2. User enters preferences (interests, style, pace)            │
│     └─► State stored locally (not saved yet)                    │
│                                                                  │
│  3. User enters verification code from email                    │
│     └─► confirmSignUp() → User verified                         │
│                                                                  │
│  4. Auto sign-in                                                │
│     └─► signIn() → JWT token returned                           │
│                                                                  │
│  5. Save preferences                                            │
│     └─► saveUserPreferences() → DynamoDB                        │
│                                                                  │
│  6. Store token                                                 │
│     └─► localStorage.setItem('idToken', jwt)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Sign In Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                         USER SIGN IN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User enters email, password                                 │
│     └─► signIn() → Cognito validates                            │
│                                                                  │
│  2. JWT returned                                                │
│     └─► Contains user claims (sub, email, etc.)                 │
│                                                                  │
│  3. Store token                                                 │
│     └─► localStorage.setItem('idToken', jwt)                    │
│                                                                  │
│  4. Update UserContext                                          │
│     └─► setUser({ isAuthenticated: true, ... })                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. AI Integration

### Bedrock Configuration

```typescript
const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

const command = new InvokeModelCommand({
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  contentType: 'application/json',
  accept: 'application/json',
  body: JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }]
  })
});
```

### AI Prompt Structure

The prompt sent to Claude includes:

1. **System Context**: Instructions for generating travel itineraries
2. **User Preferences**: Interests, travel style, pace
3. **Trip Parameters**: Destination, duration, budget, start date
4. **Output Format**: Strict JSON schema requirements

Example prompt excerpt:
```
You are an expert travel planner. Create a personalized itinerary for:

DESTINATION: Tokyo, Japan
DURATION: 7 days
BUDGET: medium
START DATE: 2024-03-15

USER PREFERENCES:
- Interests: hiking, food, museums
- Travel Style: balanced
- Pace: moderate

Generate a day-by-day itinerary in this exact JSON format:
{
  "destination": "...",
  "days": [
    {
      "date": "...",
      "blocks": [
        {
          "id": "unique-uuid",
          "start": "09:00",
          "end": "11:00",
          "title": "Activity name",
          "category": "food|museum|outdoors|shopping|other",
          "costBand": "low|med|high",
          "notes": "Why this activity",
          "address": "Full address"
        }
      ]
    }
  ],
  "packingList": ["item1", "item2"],
  "rationalePerDay": ["Day 1 rationale", "Day 2 rationale"]
}
```

### AI Output Parsing

The Lambda function:
1. Receives raw Claude response
2. Extracts JSON from response text
3. Validates required fields
4. Saves to DynamoDB
5. Returns to client

---

## 11. User Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                        COMPLETE USER JOURNEY                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐                                                   │
│  │  LANDING    │  User sees world map                              │
│  │   PAGE      │  ↓                                                │
│  └──────┬──────┘  Clicks country or "Plan Trip"                    │
│         │                                                          │
│         ▼                                                          │
│  ┌─────────────┐                                                   │
│  │   AUTH      │  Not logged in?                                   │
│  │   CHECK     │  ↓                                                │
│  └──────┬──────┘  Show auth modal                                  │
│         │                                                          │
│    ┌────┴────┐                                                     │
│    ▼         ▼                                                     │
│ ┌──────┐  ┌──────────┐                                             │
│ │LOGIN │  │ SIGN UP  │                                             │
│ └──┬───┘  │ (3 steps)│                                             │
│    │      │ 1. Email │                                             │
│    │      │ 2. Prefs │                                             │
│    │      │ 3. Verify│                                             │
│    │      └────┬─────┘                                             │
│    │           │                                                   │
│    └─────┬─────┘                                                   │
│          ▼                                                         │
│  ┌─────────────┐                                                   │
│  │    TRIP     │  Select destination                               │
│  │ PREFERENCES │  Set duration (1-14 days)                         │
│  │    PAGE     │  Choose budget                                    │
│  └──────┬──────┘  Pick start date                                  │
│         │         ↓                                                │
│         │         Click "Generate Itinerary"                       │
│         ▼                                                          │
│  ┌─────────────┐                                                   │
│  │   BEDROCK   │  Lambda receives request                          │
│  │     AI      │  Fetches user preferences                         │
│  │ GENERATION  │  Calls Claude 3 Sonnet                            │
│  └──────┬──────┘  Saves to DynamoDB                                │
│         │                                                          │
│         ▼                                                          │
│  ┌─────────────┐                                                   │
│  │ ITINERARY   │  Day-by-day view                                  │
│  │  DISPLAY    │  Activity cards                                   │
│  │    PAGE     │  Packing list                                     │
│  └─────────────┘  Daily rationale                                  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## 12. How to Edit Each Part

### Frontend Changes

| Task | Files to Edit | Notes |
|------|---------------|-------|
| Change homepage UI | `web/pages/index.tsx` | Large file, use search |
| Modify auth modals | `web/pages/index.tsx` | Look for `LoginModal`, `SignUpModal` |
| Update trip form | `web/pages/trip-preferences.tsx` | Form inputs and validation |
| Change itinerary display | `web/pages/itinerary/[id].tsx` | Activity cards, layout |
| Modify map | `web/components/LeafletWorldMap.tsx` | Leaflet configuration |
| Add new API call | `web/lib/api.ts` | Add function, update types |
| Change auth logic | `web/lib/auth.ts` | Cognito operations |
| Update global state | `web/context/UserContext.tsx` | User state management |
| Change styles | `web/styles/globals.css` | Global CSS |
| Add Tailwind utilities | `web/tailwind.config.js` | Theme customization |

### Backend Changes

| Task | Files to Edit | Notes |
|------|---------------|-------|
| Modify AI prompt | `backend/functions/generateItinerary.ts` | Look for prompt building |
| Change itinerary structure | `backend/functions/generateItinerary.ts` | Update JSON schema |
| Add new endpoint | Create new function + update CDK | See infrastructure |
| Modify data storage | Relevant function + update schema | Update DynamoDB operations |
| Add user fields | `saveUserPreferences.ts`, `getUser.ts` | Update both |

### Infrastructure Changes

| Task | Files to Edit | Notes |
|------|---------------|-------|
| Add Lambda function | `infrastructure/lib/wai-travel-stack.ts` | Add function + API route |
| Change API routes | `infrastructure/lib/wai-travel-stack.ts` | Modify API Gateway |
| Update Lambda config | `infrastructure/lib/wai-travel-stack.ts` | Memory, timeout, env vars |
| Add DynamoDB index | `infrastructure/lib/wai-travel-stack.ts` | Add GSI/LSI |
| Modify Cognito | `infrastructure/lib/wai-travel-stack.ts` | User pool settings |

---

## 13. Development Guide

### Prerequisites

- Node.js 18+
- npm 9+
- AWS CLI configured
- AWS account with Bedrock access

### Local Setup

```bash
# Clone repository
git clone <repo-url>
cd wAI-travel-planner

# Install dependencies (monorepo)
npm install

# Navigate to frontend
cd web

# Create environment file
cp .env.example .env.local

# Edit .env.local with your values
# (Get values from deployed CDK stack outputs)

# Start development server
npm run dev
```

### Development Commands

```bash
# Root directory commands
npm run dev          # Start all workspaces
npm run build        # Build all workspaces
npm run lint         # Lint all code

# Frontend commands (cd web)
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint frontend code

# Infrastructure commands (cd infrastructure)
npm run build        # Compile TypeScript
npx cdk synth        # Generate CloudFormation
npx cdk diff         # Show changes
npx cdk deploy       # Deploy to AWS
```

### Making Changes

1. **Always pull latest** before starting work
2. **Run dev server** to test changes locally
3. **Test auth flow** if modifying authentication
4. **Run build** before deploying to catch errors
5. **Check CDK diff** before deploying infrastructure

---

## 14. Deployment

### One-Command Deployment

```bash
./deploy.sh
```

This script:
1. Builds the Next.js app (`npm run build` in web/)
2. Deploys infrastructure with CDK (`npx cdk deploy`)
3. Uploads static files to S3

### Manual Deployment

```bash
# 1. Build frontend
cd web
npm run build

# 2. Deploy infrastructure
cd ../infrastructure
npx cdk deploy

# 3. Note the outputs (API URL, Cognito IDs)
# 4. Update web/.env.local if needed
# 5. Rebuild and redeploy frontend
```

### Post-Deployment

After deploying, update `web/.env.local` with CDK outputs:

```env
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_API_URL=https://XXXXXXX.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_AWS_REGION=us-east-1
```

---

## 15. Where to Go From Here

### Immediate Improvements

1. **Add Loading States**
   - Files: `web/pages/trip-preferences.tsx`, `web/pages/itinerary/[id].tsx`
   - Add spinners during API calls

2. **Error Handling**
   - Files: `web/lib/api.ts`, all pages
   - Add try-catch, error messages, retry logic

3. **Input Validation**
   - Files: `web/pages/trip-preferences.tsx`, backend functions
   - Validate dates, duration limits, budget values

4. **Responsive Design**
   - Files: All pages, `globals.css`
   - Mobile-friendly layouts

### Medium-Term Features

1. **User Feedback System**
   - Add thumbs up/down to activities
   - Files: `itinerary/[id].tsx`, new Lambda function
   - Store feedback in DynamoDB for future AI improvements

2. **Itinerary History**
   - Show past trips on homepage
   - Files: `index.tsx`, new API endpoint
   - Query user's itineraries from DynamoDB

3. **Edit Itinerary**
   - Allow modifying activities
   - Files: `itinerary/[id].tsx`, new Lambda
   - Update DynamoDB items

4. **Share Itinerary**
   - Public links for sharing
   - New page, modified access control

### Long-Term Enhancements

1. **Real-time Refinement**
   - Chat interface to modify itinerary
   - WebSocket API, streaming responses

2. **Google Maps Integration**
   - Show activities on map
   - Directions between locations
   - Files: New map component, env var already exists

3. **Booking Integration**
   - Hotel/flight booking links
   - Restaurant reservations

4. **Social Features**
   - User profiles
   - Trip reviews
   - Shared itineraries

5. **CI/CD Pipeline**
   - GitHub Actions workflow
   - Automated testing
   - Staging environment

### Code Quality

1. **Testing**
   - Add Jest for unit tests
   - Playwright for E2E tests

2. **TypeScript Strictness**
   - Enable strict mode
   - Add proper interfaces

3. **Documentation**
   - API documentation (OpenAPI/Swagger)
   - Component documentation (Storybook)

---

## Quick Reference

### File Locations by Feature

| Feature | Frontend | Backend | Infrastructure |
|---------|----------|---------|----------------|
| Auth | `lib/auth.ts`, `index.tsx` | - | `wai-travel-stack.ts` (Cognito) |
| User Profile | `UserContext.tsx` | `getUser.ts`, `saveUserPreferences.ts` | `wai-travel-stack.ts` (Lambda) |
| Trip Planning | `trip-preferences.tsx` | `generateItinerary.ts` | `wai-travel-stack.ts` (Lambda, Bedrock) |
| Itinerary | `itinerary/[id].tsx` | `getItinerary.ts` | `wai-travel-stack.ts` (Lambda) |
| Map | `LeafletWorldMap.tsx` | - | - |
| API | `lib/api.ts` | All functions | `wai-travel-stack.ts` (API Gateway) |
| Data | - | All functions | `wai-travel-stack.ts` (DynamoDB) |

### Common Tasks Cheatsheet

```bash
# Start development
cd web && npm run dev

# Deploy changes
./deploy.sh

# View CDK changes before deploy
cd infrastructure && npx cdk diff

# Check Lambda logs
aws logs tail /aws/lambda/generateItinerary --follow

# Query DynamoDB
aws dynamodb scan --table-name wai-travel
```

---

*Last updated: December 2024*
*Project: wAI Travel Planner - DubHacks Hackathon*
