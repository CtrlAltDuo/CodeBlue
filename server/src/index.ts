import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import authRoutes from './routes/auth';
import callsRoutes from './routes/calls';
import ambulancesRoutes from './routes/ambulances';
import { initSocket } from './socket';

dotenv.config();

const app = express();
const server = http.createServer(app);

initSocket(server);

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/ambulances', ambulancesRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
