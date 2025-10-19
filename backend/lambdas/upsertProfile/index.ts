import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '../../shared/dynamo-client';

// Types
interface Profile {
  userId: string;
  interests: string[];
  travelStyle?: string;
  budget?: string;
  constraints: string[];
  createdAt?: string;
  updatedAt: string;
}

interface AppSyncEvent {
  info: {
    fieldName: string;
  };
  arguments: {
    userId: string;
    input?: {
      interests: string[];
      travelStyle?: string;
      budget?: string;
      constraints: string[];
    };
  };
}

export const handler = async (event: AppSyncEvent) => {
  const { fieldName } = event.info;
  const { userId } = event.arguments;

  const pk = `USER#${userId}`;
  const sk = 'PROFILE';

  try {
    // Handle getProfile operation
    if (fieldName === 'getProfile') {
      const { Item } = await DynamoDB.send(new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { pk, sk }
      }));

      // Return null if no profile found, otherwise return the profile data
      return Item ? {
        userId: Item.userId,
        interests: Item.interests,
        travelStyle: Item.travelStyle,
        budget: Item.budget,
        constraints: Item.constraints,
        createdAt: Item.createdAt,
        updatedAt: Item.updatedAt
      } : null;
    }

    // Handle upsertProfile operation
    if (fieldName === 'upsertProfile') {
      const { input } = event.arguments;
      if (!input) throw new Error('Input is required for upsertProfile');

      const now = new Date().toISOString();
      
      // Construct the profile object
      const profile: Profile = {
        userId,
        interests: input.interests,
        travelStyle: input.travelStyle,
        budget: input.budget,
        constraints: input.constraints,
        updatedAt: now
      };

      // Check if profile already exists to preserve createdAt
      const { Item: existingItem } = await DynamoDB.send(new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { pk, sk }
      }));

      // Prepare the full item for DynamoDB
      const item = {
        pk,
        sk,
        ...profile,
        createdAt: existingItem?.createdAt || now
      };

      // Write to DynamoDB
      await DynamoDB.send(new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: item
      }));

      return profile;
    }

    throw new Error(`Unhandled field name: ${fieldName}`);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};