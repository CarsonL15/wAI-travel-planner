import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.MCP_SERVER_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

interface Place {
  name: string;
  address: string;
  lat: number;
  lon: number;
  category?: string;
  rating?: number;
}

interface ContextResponse {
  contextHint: string;
  season: string;
  weather: string;
  localTips: string[];
}

// Mock data for places search
const mockPlaces: Place[] = [
  {
    name: 'Senso-ji Temple',
    address: '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan',
    lat: 35.7148,
    lon: 139.7967,
    category: 'temple',
    rating: 4.5,
  },
  {
    name: 'Tsukiji Outer Market',
    address: '4 Chome-16-2 Tsukiji, Chuo City, Tokyo 104-0045, Japan',
    lat: 35.6654,
    lon: 139.7706,
    category: 'market',
    rating: 4.3,
  },
  {
    name: 'Tokyo Skytree',
    address: '1 Chome-1-2 Oshiage, Sumida City, Tokyo 131-0045, Japan',
    lat: 35.7101,
    lon: 139.8107,
    category: 'observation',
    rating: 4.2,
  },
  {
    name: 'Shibuya Crossing',
    address: 'Shibuya City, Tokyo 150-0002, Japan',
    lat: 35.6598,
    lon: 139.7006,
    category: 'landmark',
    rating: 4.0,
  },
  {
    name: 'Meiji Shrine',
    address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557, Japan',
    lat: 35.6763,
    lon: 139.6993,
    category: 'shrine',
    rating: 4.4,
  },
];

// Mock seasonal context data
const getSeasonalContext = (destination: string, month: number): ContextResponse => {
  const seasons = {
    'tokyo': {
      spring: { contextHint: 'cherry blossom season, mild weather', season: 'Spring', weather: 'Mild 15-20°C', localTips: ['Visit parks for cherry blossoms', 'Pack light layers'] },
      summer: { contextHint: 'hot and humid, rainy season', season: 'Summer', weather: 'Hot 25-30°C, humid', localTips: ['Bring umbrella for rain', 'Stay hydrated'] },
      fall: { contextHint: 'cool and pleasant, autumn colors', season: 'Autumn', weather: 'Cool 10-20°C', localTips: ['Perfect for walking tours', 'Autumn foliage viewing'] },
      winter: { contextHint: 'cool and dry, occasional snow', season: 'Winter', weather: 'Cool 5-15°C', localTips: ['Pack warm clothes', 'Hot springs are great'] },
    },
    'paris': {
      spring: { contextHint: 'mild weather, blooming gardens', season: 'Spring', weather: 'Mild 10-20°C', localTips: ['Garden tours', 'Outdoor cafes'] },
      summer: { contextHint: 'warm and sunny, tourist season', season: 'Summer', weather: 'Warm 20-25°C', localTips: ['Book restaurants early', 'Long daylight hours'] },
      fall: { contextHint: 'cool and crisp, wine harvest', season: 'Autumn', weather: 'Cool 5-15°C', localTips: ['Wine tours', 'Museum visits'] },
      winter: { contextHint: 'cold but festive, holiday season', season: 'Winter', weather: 'Cold 0-10°C', localTips: ['Indoor attractions', 'Holiday markets'] },
    },
  };

  const normalizedDest = destination.toLowerCase();
  const seasonData = seasons[normalizedDest as keyof typeof seasons] || seasons.paris;
  
  if (month >= 3 && month <= 5) return seasonData.spring;
  if (month >= 6 && month <= 8) return seasonData.summer;
  if (month >= 9 && month <= 11) return seasonData.fall;
  return seasonData.winter;
};

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// GET /places - Search for places near a location
app.get('/places', async (req, res) => {
  try {
    const { query, lat, lon, radius = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // TODO: Integrate with real places API (Google Places, Foursquare, etc.)
    // For now, return mock data filtered by query
    const filteredPlaces = mockPlaces.filter(place =>
      place.name.toLowerCase().includes((query as string).toLowerCase()) ||
      place.category?.toLowerCase().includes((query as string).toLowerCase())
    );

    // TODO: Apply distance filtering if lat/lon provided
    const results = filteredPlaces.map(place => ({
      name: place.name,
      address: place.address,
      lat: place.lat,
      lon: place.lon,
      category: place.category,
      rating: place.rating,
    }));

    res.json({
      success: true,
      places: results,
      total: results.length,
    });
  } catch (error) {
    console.error('Error searching places:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /context - Get contextual information for a destination
app.get('/context', async (req, res) => {
  try {
    const { destination, month } = req.query;
    
    if (!destination) {
      return res.status(400).json({ error: 'Destination parameter is required' });
    }

    const monthNum = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const context = getSeasonalContext(destination as string, monthNum);

    res.json({
      success: true,
      ...context,
    });
  } catch (error) {
    console.error('Error getting context:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Places search: http://localhost:${PORT}/places?query=temple`);
  console.log(`Context info: http://localhost:${PORT}/context?destination=tokyo&month=3`);
});

export default app;
