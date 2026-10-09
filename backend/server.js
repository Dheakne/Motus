require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth');
const exerciseRoutes = require('./src/routes/exercises');
const sessionRoutes = require('./src/routes/sessions');
const adminRoutes = require('./src/routes/admin');
const errorHandler = require('./src/middleware/errorHandler');

const { port, frontendUrl, adminFrontendUrls } = require('./src/config/env');

const app = express();

app.use(helmet());
app.use(express.json());

// CORS manual (evita dep extra)
// /api/admin aceita só as origens de ADMIN_FRONTEND_URL; o resto segue FRONTEND_URL
app.use((req, res, next) => {
  if (req.path.startsWith('/api/admin')) {
    res.setHeader('Vary', 'Origin');
    if (adminFrontendUrls.includes(req.headers.origin)) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    }
  } else {
    const origin = frontendUrl === '*' ? '*' : frontendUrl;
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Uso interno, mas exposto na internet: limite mais permissivo que o de auth
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);

// 404 para rotas não registradas (JSON padronizado, antes do errorHandler)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Rota não encontrada',
  });
});

app.use(errorHandler);

if (require.main === module) {
  app.listen(port, () => console.log(`Motus backend rodando na porta ${port}`));
}

module.exports = app;
