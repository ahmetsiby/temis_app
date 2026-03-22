import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import organizationsRoutes from './routes/organizations.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import tourneesRoutes from './routes/tournees.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import syncRoutes from './routes/sync.routes.js';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

const isProduction = process.env.NODE_ENV === 'production';

const devOrigins = [
  'http://localhost',
  'http://127.0.0.1',
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'http://localhost:8100',
  'http://127.0.0.1:8100',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://10.147.219.130',
  'http://10.147.219.130:4200',
  'http://10.147.219.130:8100',
  'http://10.147.219.130:5173',
  'capacitor://localhost',
  'ionic://localhost',
  'https://localhost',
];

const prodOrigins = [
  process.env.WEB_APP_URL,
  process.env.MOBILE_APP_URL,
  'capacitor://localhost',
  'ionic://localhost',
].filter(Boolean);

const allowedOrigins = isProduction ? prodOrigins : devOrigins;

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error('CORS blocked origin:', origin);
    return callback(new Error(`Origine non autorisée par CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-organization-id',
  ],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: '1mb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 300 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isProduction || req.method === 'OPTIONS',
  message: { message: 'Trop de requêtes, réessayez plus tard.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isProduction || req.method === 'OPTIONS',
  message: { message: 'Trop de tentatives, réessayez plus tard.' },
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use(globalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/tournees', tourneesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sync', syncRoutes);

app.use((_req, res) => {
  res.status(404).json({
    message: 'Route introuvable',
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);

  const statusCode =
    Number.isInteger(err?.status) && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  res.status(statusCode).json({
    message:
      statusCode === 500 && isProduction
        ? 'Erreur interne serveur'
        : err?.message ?? 'Erreur interne serveur',
  });
});

export default app;