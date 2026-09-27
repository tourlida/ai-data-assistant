import express, { type ErrorRequestHandler } from 'express';
import { environment } from './config';
import { closeDatabaseConnection } from './db/pool';
import apiRouter from './routes/api';

export const app = express();
app.use(express.json({ limit: '16kb' }));
app.use('/api', apiRouter);

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error?.name === 'ZodError') return response.status(400).json({ error: 'Validation failed', details: error.issues });
  console.error(error);
  return response.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);

const server = app.listen(environment.PORT, () => {
  console.log(`Server listening on http://localhost:${environment.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down`);
  server.close(async () => {
    await closeDatabaseConnection();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
