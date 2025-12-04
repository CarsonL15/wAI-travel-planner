import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.requestContext.authorizer?.claims.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const body = JSON.parse(event.body || '{}');

    // Fetch user profile from DynamoDB
    const profileResult = await dynamoDB.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME!,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      })
    );

    const userProfile = profileResult.Item;
    
    // Merge user profile preferences with request-specific inputs
    const interests = body.interests || userProfile?.interests || [];
    const travelStyle = body.travelStyle || userProfile?.travelStyle || 'balanced';
    const pace = body.pace || userProfile?.pace || 'moderate';
    const budget = body.budget || (travelStyle === 'luxury' ? 'high' : travelStyle === 'budget' ? 'low' : 'medium');

    // Build enhanced prompt with user preferences
    const interestList = Array.isArray(interests) ? interests.join(', ') : interests;
    
    const prompt = `Generate a ${body.duration}-day travel itinerary for ${body.destination}.

User profile and preferences:
- Travel interests: ${interestList || 'general sightseeing'}
- Travel style: ${travelStyle} (luxury, budget-friendly, balanced, or backpacker)
- Preferred pace: ${pace} (relaxed, moderate, or fast-paced)
- Budget level: ${budget}
- Start date: ${body.startDate || 'flexible'}

IMPORTANT: Tailor the itinerary to match the user's interests and travel style. For example:
- If interested in "hiking", prioritize outdoor activities and nature spots
- If interested in "nightlife", include evening entertainment and bars
- If travel style is "luxury", suggest high-end hotels and fine dining
- If travel style is "budget", focus on affordable hostels and local eateries
- If pace is "relaxed", include plenty of downtime and fewer activities per day
- If pace is "fast-paced", pack the schedule with multiple activities

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "destination": "${body.destination}",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "blocks": [
        {
          "id": "unique-id",
          "start": "09:00",
          "end": "11:00",
          "title": "Activity name",
          "category": "food",
          "costBand": "med",
          "notes": "Why visit",
          "address": "Full address"
        }
      ]
    }
  ],
  "packingList": ["item1", "item2"],
  "rationalePerDay": ["Day 1: Reason", "Day 2: Reason"]
}`;

    const response = await bedrock.send(
      new InvokeModelCommand({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        contentType: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 4096,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
    );

    const result = JSON.parse(new TextDecoder().decode(response.body));
    const content = result.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Bedrock response');
    }
    
    const itinerary = JSON.parse(jsonMatch[0]);

    // Save to DynamoDB
    const id = `ITIN-${Date.now()}`;
    const item = {
      PK: `USER#${userId}`,
      SK: `ITIN#${id}`,
      id,
      userId,
      ...itinerary,
      createdAt: new Date().toISOString(),
    };

    await dynamoDB.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME!,
        Item: item,
      })
    );

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(item),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to generate itinerary' }),
    };
  }
}
