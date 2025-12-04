import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

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

    // Query all itineraries for this user
    const result = await dynamoDB.send(
      new QueryCommand({
        TableName: process.env.TABLE_NAME!,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'ITIN#',
        },
        // Sort by most recent first
        ScanIndexForward: false,
      })
    );

    // Map to a cleaner format for the frontend
    const itineraries = (result.Items || []).map((item) => ({
      id: item.id,
      destination: item.destination,
      startDate: item.startDate,
      endDate: item.endDate,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      daysCount: item.days?.length || 0,
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ itineraries }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to fetch itineraries' }),
    };
  }
}
