import express from 'express';
import generateLoginUrl from '../utils/auth.js';
import { getAccessToken } from '../config/spotify.js';

const router = express.Router();

// Перенаправляет пользователя на Spotify для авторизации
router.get('/login', (req, res) => {
  const url = generateLoginUrl();
  res.redirect(url);
});

// Получает токены после редиректа
router.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Missing code');
  }

  try {
    const tokenData = await getAccessToken(code);

    // Можно сохранить токены в БД, куки, или передать на фронт
    res.redirect(`${process.env.FRONTEND_URI}/?access_token=${tokenData.access_token}&refresh_token=${tokenData.refresh_token}`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Error exchanging code for token');
  }
});

export default router;
