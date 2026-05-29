import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import authRoutes from './routes/auth';
import callsRoutes from './routes/calls';
import ambulancesRoutes from './routes/ambulances';
import analyticsRoutes from './routes/analytics';
import hospitalsRoutes from './routes/hospitals';
import { initSocket } from './socket';
import { pool } from './db/pool';

dotenv.config();

const app = express();
const server = http.createServer(app);

initSocket(server);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/ambulances', ambulancesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/hospitals', hospitalsRoutes);

app.get('/health', async (req, res) => {
  let db_connected = false;
  try {
    await pool.query('SELECT 1');
    db_connected = true;
  } catch (e) {
    db_connected = false;
  }
  res.json({
    uptime: process.uptime(),
    db_connected
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
