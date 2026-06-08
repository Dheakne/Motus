require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth');
const exerciseRoutes = require('./src/routes/exercises');
const sessionRoutes = require('./src/routes/sessions');
const errorHandler = require('./src/middleware/errorHandler');

const { port, frontendUrl } = require('./src/config/env');

const app = express();

app.use(helmet());
app.use(express.json());

// CORS manual (evita dep extra)
app.use((req, res, next) => {
  const origin = frontendUrl === '*' ? '*' : frontendUrl;
  res.setHeader('Access-Control-Allow-Origin', origin);
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

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/sessions', sessionRoutes);

app.use(errorHandler);

if (require.main === module) {
  app.listen(port, () => console.log(`Motus backend rodando na porta ${port}`));
}

module.exports = app;
