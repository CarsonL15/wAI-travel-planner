import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

interface RegenerateRequest {
  destination: string;
  date: string;
  startTime: string;
  endTime: string;
  category?: string;
  // Activities from the ENTIRE trip, not just the day
  allTripActivities?: Array<{ title: string; location?: string }>;
  preferences?: {
    interests?: string[];
    budget?: string;
    pace?: string;
  };
}

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

    const body: RegenerateRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.destination) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing destination' }),
      };
    }

    if (!body.date) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing date' }),
      };
    }

    // Build STRICT exclusion list from ALL activities in the entire trip
    // ALSO include the current activity being regenerated (passed via currentActivity)
    const excludedActivities = body.allTripActivities || [];

    const exclusionList = excludedActivities.length > 0
      ? `\n\n🚫 ABSOLUTELY FORBIDDEN - NEVER SUGGEST ANY OF THESE:\n${excludedActivities.map(a => `- "${a.title}"${a.location ? ` at ${a.location}` : ''}`).join('\n')}\n\n⚠️ CRITICAL RULES:\n1. You MUST suggest a COMPLETELY DIFFERENT place/activity\n2. Do NOT just change the description - suggest a DIFFERENT restaurant/museum/attraction\n3. The title MUST be different from all forbidden items above\n4. The location MUST be different from all forbidden items above\n5. If the user is regenerating "Lunch at Le Grand Véfour", you CANNOT suggest Le Grand Véfour again - pick a DIFFERENT restaurant entirely`
      : '';

    // Build preferences context
    const prefsContext = body.preferences
      ? `\nUser preferences: ${body.preferences.interests?.join(', ') || 'general sightseeing'}, budget: ${body.preferences.budget || 'medium'}, pace: ${body.preferences.pace || 'moderate'}`
      : '';

    const timeSlot = body.startTime && body.endTime
      ? `for the time slot ${body.startTime} to ${body.endTime}`
      : 'for a 2-hour activity';

    const categoryHint = body.category && body.category !== 'other'
      ? `Category preference: ${body.category}.`
      : '';

    const prompt = `Generate ONE unique activity suggestion for ${body.destination} on ${body.date} ${timeSlot}. ${categoryHint}${prefsContext}${exclusionList}

IMPORTANT RULES:
1. Suggest a SPECIFIC real place in ${body.destination} - use the actual name of the restaurant, museum, park, etc.
2. Do NOT suggest generic activities like "Visit a local cafe" - give the exact name
3. Do NOT repeat any activity or location from the forbidden list above
4. Be CREATIVE - suggest hidden gems, local favorites, unique experiences
5. Include specific details that make this activity special

Return ONLY this JSON format (no other text):
{
  "title": "Specific Activity Name",
  "description": "Brief 1-2 sentence description with why this is special",
  "category": "food|sightseeing|outdoor|culture|shopping|relaxation|nightlife|other",
  "location": "Exact address or specific landmark name in ${body.destination}",
  "estimatedCost": "low|medium|high",
  "startTime": "${body.startTime || '10:00'}",
  "endTime": "${body.endTime || '12:00'}"
}`;

    const response = await bedrock.send(
      new InvokeModelCommand({
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        contentType: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 512,
          temperature: 0.8, // Slightly higher for variety
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

    const activity = JSON.parse(jsonMatch[0]);

    // Generate a unique ID for the activity
    activity.id = `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    activity.isCustom = false;

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(activity),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to generate activity' }),
    };
  }
}
