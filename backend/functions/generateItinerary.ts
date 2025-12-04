import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

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

    // Input validation
    if (!body.destination || typeof body.destination !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing or invalid destination' }),
      };
    }
    if (!body.duration || typeof body.duration !== 'number' || body.duration < 1 || body.duration > 14) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Duration must be a number between 1 and 14' }),
      };
    }
    if (!body.startDate || typeof body.startDate !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing or invalid start date' }),
      };
    }

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

    // Build concise prompt for faster generation
    const interestList = Array.isArray(interests) ? interests.join(', ') : interests;

    // Calculate dates
    const startDateObj = new Date(body.startDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + body.duration - 1);
    const endDateStr = endDateObj.toISOString().split('T')[0];

    // Generate date strings for each day
    const dayDates = [];
    for (let i = 0; i < body.duration; i++) {
      const d = new Date(startDateObj);
      d.setDate(d.getDate() + i);
      dayDates.push(d.toISOString().split('T')[0]);
    }

    const prompt = `Create a ${body.duration}-day itinerary for ${body.destination}. Style: ${travelStyle}, pace: ${pace}, interests: ${interestList || 'sightseeing'}.

Return ONLY this JSON (3-4 activities per day):
{"destination":"${body.destination}","startDate":"${body.startDate}","endDate":"${endDateStr}","days":[${dayDates.map((date, i) => `{"date":"${date}","blocks":[{"id":"d${i + 1}a1","start":"09:00","end":"11:00","title":"Morning activity","category":"sightseeing","costBand":"med","notes":"Brief note","address":"Address"},{"id":"d${i + 1}a2","start":"12:00","end":"13:30","title":"Lunch","category":"food","costBand":"med","notes":"Brief note","address":"Address"},{"id":"d${i + 1}a3","start":"14:30","end":"17:00","title":"Afternoon activity","category":"culture","costBand":"med","notes":"Brief note","address":"Address"}]}`).join(',')}],"packingList":["item1","item2","item3"],"rationalePerDay":[${dayDates.map((_, i) => `"Day ${i + 1} focus"`).join(',')}]}

Replace placeholders with real ${body.destination} attractions, restaurants, and activities. Categories: food, museum, outdoors, shopping, other. CostBand: low, med, high.`;

    const response = await bedrock.send(
      new InvokeModelCommand({
        // Haiku is much faster (3-8 sec vs 20-40 sec for Sonnet)
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        contentType: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 2048,
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
