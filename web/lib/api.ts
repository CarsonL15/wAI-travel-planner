import { getIdToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getIdToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const fullUrl = `${API_URL}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    let error: { error?: string; message?: string };
    try {
      error = JSON.parse(errorText);
    } catch {
      error = { error: response.statusText };
    }

    throw new Error(error.error || error.message || 'API request failed');
  }

  return response.json();
}

export async function generateItinerary(data: {
  destination: string;
  duration: number;
  interests: string[];
  budget: string;
  startDate: string;
}) {
  return fetchWithAuth('/itineraries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getItinerary(id: string) {
  return fetchWithAuth(`/itineraries/${id}`);
}

export async function getUser() {
  return fetchWithAuth('/user');
}
