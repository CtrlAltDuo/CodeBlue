import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';

let io: SocketServer;

export const initSocket = (server: Server) => {
  io = new SocketServer(server, {
    cors: { origin: process.env.CLIENT_URL || '*' }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_room', (room: string) => {
      socket.join(room);
    });

    socket.on('location_update', (data: any) => {
      if (data.callId) {
        io.to(`call:${data.callId}`).emit('location_update', data);
      }
      if (data.ambulanceId) {
        io.to(`driver:${data.ambulanceId}`).emit('location_update', data);
      }
      io.to('admin').emit('location_update', data);
    });

    socket.on('call_accepted', (data: any) => {
      io.to('admin').emit('call_accepted', data);
    });

    socket.on('call_rejected', (data: any) => {
      io.to('admin').emit('call_rejected', data);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
