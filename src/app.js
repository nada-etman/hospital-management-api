const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const logger = require('./config/logger');
const prisma = require('./config/db');
const redis = require('./config/redis');
const ApiResponse = require('./utils/apiResponse');
const { generalLimiter } = require('./middlewares/rateLimiter.middleware');
const errorMiddleware = require('./middlewares/error.middleware');
const v1Routes = require('./routes/v1');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json());
app.use(cookieParser());
app.use(generalLimiter);
app.use('/uploads', express.static('uploads'));

// API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Versioned API
app.use('/api/v1', v1Routes);

// Health check — checks the DB and (optional) Redis, not just "the process is alive"
app.get('/health', async (req, res) => {
  const health = { status: 'OK', timestamp: new Date(), checks: {} };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'OK';
  } catch {
    health.checks.database = 'FAILED';
    health.status = 'DEGRADED';
  }

  if (redis) {
    try {
      await redis.ping();
      health.checks.redis = 'OK';
    } catch {
      health.checks.redis = 'FAILED';
      health.status = 'DEGRADED';
    }
  } else {
    health.checks.redis = 'NOT_CONFIGURED';
  }

  res.status(health.status === 'OK' ? 200 : 503).json(health);
});

// 404 for anything unmatched
app.use((req, res) => {
  ApiResponse.error(res, { message: `Route ${req.originalUrl} not found`, statusCode: 404 });
});

app.use(errorMiddleware);

module.exports = app;
