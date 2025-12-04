import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.requestContext.authorizer?.claims.sub;
    const email = event.requestContext.authorizer?.claims.email;
    
    if (!userId) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { interests, travelStyle, pace } = body;

    // Input validation
    if (!interests || !Array.isArray(interests)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Interests must be an array' }),
      };
    }
    if (!travelStyle || typeof travelStyle !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Travel style is required' }),
      };
    }
    if (!pace || typeof pace !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Pace is required' }),
      };
    }

    // Save user profile to DynamoDB
    await dynamoDB.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME!,
        Item: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
          userId,
          email,
          interests,
          travelStyle,
          pace,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    );

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        message: 'Preferences saved successfully',
        userId,
        interests,
        travelStyle,
        pace,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to save preferences' }),
    };
  }
}
