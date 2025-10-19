import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    hasKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    keyPrefix: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 8)
  })
}