import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export interface Profile {
  interests: string[];
  travelStyle: string;
  budget: string;
  constraints: string[];
}

export interface GenerateItineraryRequest {
  profile: Profile;
  destination: string;
  startDate: string;
  endDate: string;
  contextHints?: string;
}

export interface ItineraryResponse {
  days: Array<{
    date: string;
    blocks: Array<{
      start: string;
      end: string;
      title: string;
      category: 'food' | 'museum' | 'outdoors' | 'shopping' | 'other';
      costBand: 'low' | 'med' | 'high';
      notes: string;
      address: string;
      lat: number;
      lon: number;
    }>;
  }>;
  packingList: string[];
  rationalePerDay: string[];
}

export class BedrockService {
  private modelId: string;

  constructor(modelId: string = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0') {
    this.modelId = modelId;
  }

  async generateItinerary(request: GenerateItineraryRequest): Promise<ItineraryResponse> {
    try {
      const prompt = this.buildPrompt(request);
      
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 4000,
          temperature: 0.7,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      // TODO: Validate response against itinerarySchema.json
      const content = responseBody.content[0].text;
      
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse Bedrock response as JSON:', parseError);
        // TODO: Implement retry logic with "return valid JSON per schema only" prompt
        throw new Error('Invalid JSON response from Bedrock');
      }
    } catch (error) {
      console.error('Error generating itinerary with Bedrock:', error);
      throw error;
    }
  }

  private buildPrompt(request: GenerateItineraryRequest): string {
    const { profile, destination, startDate, endDate, contextHints } = request;
    
    return `You are a travel planning AI. Generate a personalized ${destination} itinerary for ${startDate} to ${endDate}.

User Profile:
- Interests: ${profile.interests.join(', ')}
- Travel Style: ${profile.travelStyle}
- Budget: ${profile.budget}
- Constraints: ${profile.constraints.join(', ')}

${contextHints ? `Additional Context: ${contextHints}` : ''}

Return ONLY valid JSON matching this exact schema:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "blocks": [
        {
          "start": "HH:MM",
          "end": "HH:MM",
          "title": "Activity Title",
          "category": "food|museum|outdoors|shopping|other",
          "costBand": "low|med|high",
          "notes": "Additional details",
          "address": "Full address",
          "lat": 0.0,
          "lon": 0.0
        }
      ]
    }
  ],
  "packingList": ["item1", "item2"],
  "rationalePerDay": ["explanation for each day"]
}

Requirements:
- Include realistic coordinates (lat/lon) for each activity
- Provide specific addresses
- Match the user's interests and travel style
- Respect budget constraints
- Include diverse activities across categories
- Provide practical packing suggestions
- Explain the rationale for each day's activities

Return ONLY the JSON object, no other text.`;
  }
}
