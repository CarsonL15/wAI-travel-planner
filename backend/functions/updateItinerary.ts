import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}));

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

    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing itinerary ID' }),
      };
    }

    const body = JSON.parse(event.body || '{}');

    // Validate that days array exists and has proper structure
    if (!body.days || !Array.isArray(body.days)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing or invalid days array' }),
      };
    }

    // Verify the itinerary exists and belongs to this user
    const existingItem = await dynamoDB.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME!,
        Key: {
          PK: `USER#${userId}`,
          SK: `ITIN#${id}`,
        },
      })
    );

    if (!existingItem.Item) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Itinerary not found' }),
      };
    }

    // Update the itinerary
    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: process.env.TABLE_NAME!,
        Key: {
          PK: `USER#${userId}`,
          SK: `ITIN#${id}`,
        },
        UpdateExpression: 'SET days = :days, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':days': body.days,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result.Attributes),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to update itinerary' }),
    };
  }
}
