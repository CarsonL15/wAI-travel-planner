import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export const docClient = DynamoDBDocumentClient.from(client);

export interface DynamoItem {
  PK: string;
  SK: string;
  [key: string]: any;
}

export class DynamoService {
  private tableName: string;

  constructor(tableName: string = process.env.DYNAMODB_TABLE_NAME || 'wai-travel-planner') {
    this.tableName = tableName;
  }

  async getItem(pk: string, sk: string): Promise<DynamoItem | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
      });
      const result = await docClient.send(command);
      return result.Item as DynamoItem || null;
    } catch (error) {
      console.error('Error getting item from DynamoDB:', error);
      throw error;
    }
  }

  async putItem(item: DynamoItem): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: item,
      });
      await docClient.send(command);
    } catch (error) {
      console.error('Error putting item to DynamoDB:', error);
      throw error;
    }
  }

  async queryItems(pk: string, skBeginsWith?: string): Promise<DynamoItem[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk' + (skBeginsWith ? ' AND begins_with(SK, :sk)' : ''),
        ExpressionAttributeValues: {
          ':pk': pk,
          ...(skBeginsWith && { ':sk': skBeginsWith }),
        },
      });
      const result = await docClient.send(command);
      return result.Items as DynamoItem[] || [];
    } catch (error) {
      console.error('Error querying items from DynamoDB:', error);
      throw error;
    }
  }

  async updateItem(pk: string, sk: string, updates: Record<string, any>): Promise<DynamoItem> {
    try {
      const updateExpression = Object.keys(updates)
        .map((key, index) => `${key} = :val${index}`)
        .join(', ');
      
      const expressionAttributeValues = Object.entries(updates).reduce(
        (acc, [key, value], index) => ({
          ...acc,
          [`:val${index}`]: value,
        }),
        {}
      );

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
        UpdateExpression: `SET ${updateExpression}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      });
      
      const result = await docClient.send(command);
      return result.Attributes as DynamoItem;
    } catch (error) {
      console.error('Error updating item in DynamoDB:', error);
      throw error;
    }
  }
}
