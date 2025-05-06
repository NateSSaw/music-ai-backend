import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());

let access_token = null;
let refresh_token = null;

// Функция для обновления токенов с использованием refresh_token
const refreshAccessToken = async () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description);
  }

  access_token = data.access_token;
};

app.get('/login', (req, res) => {
  const scopes = 'user-read-private user-read-email playlist-read-private';
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  const clientId = process.env.SPOTIFY_CLIENT_ID;

  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });
  
      const data = await response.json();
  
      if (response.status !== 200) {
        console.error('Error during token exchange:', data);
        return res.status(500).json({ error: 'Failed to exchange code for tokens', details: data });
      }
  
      access_token = data.access_token;
      refresh_token = data.refresh_token;
  
      res.send('✅ Успешно авторизовано. Можно закрыть окно.');
    } catch (error) {
      console.error('Error during authorization process:', error);
      res.status(500).send('Error during authorization process.');
    }
  });
  

app.get('/me', async (req, res) => {
  if (!access_token) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (response.status === 401) {
      await refreshAccessToken();
      return res.redirect('/me');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

app.get('/playlists', async (req, res) => {
  if (!access_token) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  try {
    const response = await fetch('https://api.spotify.com/v1/me/playlists', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (response.status === 401) {
      await refreshAccessToken();
      return res.redirect('/playlists');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

app.get('/playlist/:id/tracks', async (req, res) => {
    const playlistId = req.params.id; // ID плейлиста
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      const data = await response.json();
      res.json(data); // Выводим треки из плейлиста
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      res.status(500).json({ error: 'Failed to fetch playlist tracks' });
    }
  });

  app.post('/playlist/:id/add', async (req, res) => {
    const playlistId = req.params.id;
    const trackUri = req.body.trackUri; // URI трека для добавления
  
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [trackUri], // URI трека для добавления
        }),
      });
      const data = await response.json();
      res.json(data); // Ответ после добавления
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      res.status(500).json({ error: 'Failed to add track to playlist' });
    }
  });

  app.get('/search', async (req, res) => {
    const query = req.query.q; // Поисковый запрос
    try {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,playlist`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      const data = await response.json();
      res.json(data); // Выводим результаты поиска
    } catch (error) {
      console.error('Error searching:', error);
      res.status(500).json({ error: 'Failed to search' });
    }
  });

  app.get('/track/:id', (req, res) => {
    const trackId = req.params.id; // ID трека
    const trackUrl = `https://open.spotify.com/track/${trackId}`;
    res.redirect(trackUrl); // Перенаправляем на Spotify
  });

  app.get('/playlist/:id', async (req, res) => {
    const playlistId = req.params.id;
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      const data = await response.json();
      res.json(data); // Отправляем информацию о плейлисте
    } catch (error) {
      console.error('Error fetching playlist info:', error);
      res.status(500).json({ error: 'Failed to fetch playlist information' });
    }
  });
  
  app.get('/', (req, res) => {
    res.send('🎵 Music AI backend is running!');
  });
  
  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });
  