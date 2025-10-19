import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Missing GEMINI_API_KEY in environment');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export type TripPreferences = {
  location: string;
  duration: number;
  groupSize: number;
  interests: string[];
  attractionType: string;
  budget: string;
  tripPace: string;
  travelStyle: string;
  mustSeeAttractions: string[];
};

export type GenerateOptions = {
  mode?: 'full' | 'regenerateDay';
  dayIndex?: number;
  dayTypes?: string[];
};

/**
 * Ask Gemini to generate a structured itinerary JSON string. The function
 * returns the raw string output from the model (expected to be JSON). Do not
 * parse here so callers can inspect/attempt to recover malformed outputs.
 */
export async function generateItineraryJSON(
  prefs: TripPreferences | any,
  options: GenerateOptions = {}
): Promise<string> {
  const { mode = 'full', dayIndex, dayTypes } = options;

  const prompt = `
You are an expert travel planner. Receive a TripPreferences JSON and (optionally) a regeneration request.
Return ONLY valid JSON (no explanatory text, no markdown). The JSON must be an array of DayPlan objects.

DayPlan: {
  date: string (YYYY-MM-DD),
  activities: [
    {
      id: string,
      time: string (HH:MM),
      name: string,
      description: string,
      duration: string,
      cost: string,
      type: string
    }
  ]
}

Behavior:
- If mode is 'full', return an array with length equal to prefs.duration. Dates should start from today and increment by one day.
- If mode is 'regenerateDay', return an array with exactly one DayPlan for the requested dayIndex. Use the same date as the original day if provided by the caller.
- IDs should be unique strings (you can combine dayIndex + activity index or timestamps).
- Keep costs and durations human-readable (e.g., "€15", "2 hours").
- types should be short tags like 'food', 'attraction', 'transport', 'rest', 'activity'.

Input JSON:
${JSON.stringify({ prefs, options: { mode, dayIndex, dayTypes } }, null, 2)}

Return the JSON now:
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  // SDK may surface text in different fields depending on version.
  const textOut = (response as any)?.text
    || (response as any)?.output?.[0]?.content
    || (response as any)?.output?.[0]?.text
    || (response as any)?.outputs?.[0]?.content
    || (response as any)?.outputs?.[0]?.text;

  if (!textOut) {
    throw new Error('No text returned from Gemini client');
  }

  return String(textOut).trim();
}

export default ai;
