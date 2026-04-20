import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { setupSocketHandlers } from './socket/handlers';
import { setupWebRTCHandlers } from './webrtc/handlers';
import scoreRoutes from './routes/scores';
import ensembleRoutes from './routes/ensembles';
import rehearsalRoutes from './routes/rehearsals';
import uploadRoutes from './routes/upload';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

export const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/scores', scoreRoutes);
app.use('/api/ensembles', ensembleRoutes);
app.use('/api/rehearsals', rehearsalRoutes);
app.use('/api/upload', uploadRoutes);

// Socket.io handlers
setupSocketHandlers(io);
setupWebRTCHandlers(io);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🎼 EduTempo 后端服务运行在端口 ${PORT}`);
  console.log(`📡 WebSocket 服务已启动`);
  console.log(`🎤 WebRTC 信令服务已启动`);
});

export { io };
