import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

export async function refreshAccessToken(refresh_token) {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const auth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
    }),
  });

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('Failed to refresh access token');
  }

  return data.access_token;
}
