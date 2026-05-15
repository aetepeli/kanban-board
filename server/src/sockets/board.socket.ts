import { Server, Socket } from 'socket.io';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import * as socketTypes from './socket.type';
import boardServices from 'services/board/board.service';

export const setupBoardSockets = (io: Server) => {
  io.use((socket, next) => {
    const authHeader = socket.handshake.headers.authorization;
    const token = socket.handshake.auth.token || (authHeader && authHeader.split(' ')[1]);

    if (!token) {
      return next(new Error('Authentication error: Token is required'));
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      (err: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
        if (err) {
          return next(new Error('Authentication error: Invalid token'));
        }

        const user = decoded as socketTypes.userPayload;
        socket.data.user = user;

        next();
      }
    );
  });

  io.on('connection', (socket: Socket) => {
    console.log(`New user is connected: ${socket.data.user.userId}`);

    socket.on('join_board', async (payload: socketTypes.joinBoardPayload) => {
      try {
        const { userId } = socket.data.user;
        const { boardId } = payload;

        const hasAccess = await boardServices.checkUserAccess({ boardId, userId });

        if (!hasAccess) {
          return socket.emit('error', { message: 'Access denied to the board.' });
        }

        socket.join(boardId);

        console.log(`User ${userId}, Board-${boardId} joined the room.`);

        socket.to(boardId).emit('user_presence', { userId, status: 'online' }); // frontend de buraya bakmayı unutma (online offline muhabbeti)
      } catch (error) {
        console.error('Error joining board room:', error);
        socket.emit('error', { message: 'Failed to join the board room.' });
      }
    });

    socket.on('leave_board', (payload: socketTypes.leaveBoardPayload) => {
      socket.leave(payload.boardId);
      console.log(`User ${socket.id}, Board-${payload.boardId} left the room.`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.data.user.userId}, Reason: ${reason}`);

      if (reason === 'ping timeout') {
        console.log('User disconnected due to ping timeout.');
      } else if (reason === 'transport close' || reason === 'client namespace disconnect') {
        console.log('User disconnected due to transport close or client namespace disconnect.');
      }
    });
  });
};
