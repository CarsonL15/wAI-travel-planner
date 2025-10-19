import type { NextApiRequest, NextApiResponse } from 'next';
import { generateItineraryJSON, TripPreferences } from '@/lib/geminiClient';

type DayActivity = {
  id: string;
  time: string;
  name: string;
  description: string;
  duration: string;
  cost: string;
  type: string;
};

type DayPlan = {
  date: string;
  activities: DayActivity[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { preferences, mode, dayIndex, dayTypes } = req.body || {};

    if (!preferences) return res.status(422).json({ error: '`preferences` required' });

    // Simple input size guard
    const inputStr = JSON.stringify({ preferences, mode, dayIndex, dayTypes });
    if (inputStr.length > 100_000) return res.status(413).json({ error: 'Input too large' });

  const raw = await generateItineraryJSON(preferences as TripPreferences, { mode, dayIndex, dayTypes });

    // Extract the first complete JSON object/array substring from raw output.
    function extractFirstJson(text: string): string | null {
      const start = text.search(/[\{\[]/);
      if (start === -1) return null;
      const openChar = text[start];
      const closeChar = openChar === '{' ? '}' : ']';
      let depth = 0;
      let inString = false;
      let escape = false;
      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (inString) {
          if (escape) { escape = false; continue; }
          if (ch === '\\') { escape = true; continue; }
          if (ch === '"') { inString = false; continue; }
        } else {
          if (ch === '"') { inString = true; continue; }
          if (ch === openChar) { depth++; }
          else if (ch === closeChar) {
            depth--;
            if (depth === 0) {
              return text.slice(start, i + 1);
            }
          }
        }
      }
      return null;
    }

    const jsonSubstring = extractFirstJson(raw);
    if (!jsonSubstring) {
      return res.status(500).json({ error: 'No JSON found in model output', raw });
    }

    let parsed: DayPlan | DayPlan[] | null = null;
    try {
      parsed = JSON.parse(jsonSubstring);
    } catch (err) {
      // Try a light cleanup: remove trailing commas then reparse
      try {
        const cleaned = jsonSubstring.replace(/,\s*([\}\]])/g, '$1');
        parsed = JSON.parse(cleaned);
      } catch (err2: any) {
        console.error('Failed to parse model JSON substring:', err2);
        return res.status(500).json({
          error: 'Failed to parse JSON from model output',
          parseError: String(err2?.message || err2),
          raw,
          jsonSubstring,
        });
      }
    }

    // Return both the parsed itinerary and the raw model output for debugging/inspection.
    return res.status(200).json({ itinerary: parsed, raw });
  } catch (err: any) {
    console.error('generate-itinerary error:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
