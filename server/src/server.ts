import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import v1Routes from './routes/v1/v1.routes';

import http from 'http';
import { Server } from 'socket.io';
import { setupBoardSockets } from './sockets/board.socket';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/api/v1', v1Routes);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});
app.set('io', io);

setupBoardSockets(io);
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Server and Socket.IO are running on ${PORT}`);
  });
}

export { app, httpServer };
