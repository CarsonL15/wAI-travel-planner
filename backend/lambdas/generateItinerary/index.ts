import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoService } from '../shared/dynamo-client';
import { BedrockService, GenerateItineraryRequest } from '../shared/bedrock-client';

interface GenerateItineraryInput {
  destination: string;
  startDate: string;
  endDate: string;
  contextHints?: string;
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Generate Itinerary Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    // TODO: Extract userId from Cognito JWT token
    const userId = 'mock-user-id'; // This should come from the JWT token
    
    // TODO: Parse GraphQL input from AppSync event
    const input: GenerateItineraryInput = {
      destination: 'Tokyo, Japan', // Mock data for now
      startDate: '2024-03-15',
      endDate: '2024-03-22',
      contextHints: 'spring travel, urban exploration',
    };

    // TODO: Load user profile from DynamoDB
    const dynamoService = new DynamoService();
    const profile = await dynamoService.getItem(`USER#${userId}`, 'PROFILE');
    
    if (!profile) {
      throw new Error('User profile not found');
    }

    // TODO: Generate itinerary using Bedrock
    const bedrockService = new BedrockService();
    const itineraryRequest: GenerateItineraryRequest = {
      profile: {
        interests: profile.interests || [],
        travelStyle: profile.travelStyle || 'cultural',
        budget: profile.budget || 'mid-range',
        constraints: profile.constraints || [],
      },
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
      contextHints: input.contextHints,
    };

    // For now, return mock data instead of calling Bedrock
    const mockItinerary = {
      days: [
        {
          date: '2024-03-15',
          blocks: [
            {
              start: '09:00',
              end: '11:00',
              title: 'Senso-ji Temple',
              category: 'museum' as const,
              costBand: 'low' as const,
              notes: 'Traditional Buddhist temple in Asakusa',
              address: '2 Chome-3-1 Asakusa, Taito City, Tokyo',
              lat: 35.7148,
              lon: 139.7967,
            },
            {
              start: '12:00',
              end: '13:30',
              title: 'Lunch at Tsukiji Outer Market',
              category: 'food' as const,
              costBand: 'med' as const,
              notes: 'Fresh sushi and local delicacies',
              address: '4 Chome-16-2 Tsukiji, Chuo City, Tokyo',
              lat: 35.6654,
              lon: 139.7706,
            },
          ],
        },
      ],
      packingList: [
        'Comfortable walking shoes',
        'Light jacket for spring weather',
        'Universal power adapter',
        'Portable WiFi or SIM card',
      ],
      rationalePerDay: [
        'Day 1 focuses on traditional Tokyo culture with Senso-ji Temple and authentic local food at Tsukiji Market.',
      ],
    };

    // TODO: Save itinerary to DynamoDB
    const itineraryId = `itin-${Date.now()}`;
    const itineraryRecord = {
      PK: `USER#${userId}`,
      SK: `ITIN#${itineraryId}`,
      id: itineraryId,
      userId,
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
      days: mockItinerary.days,
      packingList: mockItinerary.packingList,
      rationalePerDay: mockItinerary.rationalePerDay,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamoService.putItem(itineraryRecord);

    // TODO: Save individual day records
    for (const day of mockItinerary.days) {
      await dynamoService.putItem({
        PK: `ITIN#${itineraryId}`,
        SK: `DAY#${day.date}`,
        ...day,
      });
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: itineraryRecord,
      }),
    };
  } catch (error) {
    console.error('Error generating itinerary:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
