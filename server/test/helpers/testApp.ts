// ─────────────────────────────────────────────────────────────────────────────
// test/helpers/testApp.ts
// Supertest için Express app'i izole şekilde başlatır.
// Gerçek server.ts'deki socket.io ve httpServer olmadan sadece Express app döner.
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import v1Routes from '../../src/routes/v1/v1.routes';

export const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use('/api/v1', v1Routes);

  return app;
};
