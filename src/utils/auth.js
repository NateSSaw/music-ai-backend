import dotenv from 'dotenv';
dotenv.config();

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-top-read',
];

const generateLoginUrl = () => {
  const query = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: SCOPES.join(' '),
  });

  return `https://accounts.spotify.com/authorize?${query.toString()}`;
};

export default generateLoginUrl;
