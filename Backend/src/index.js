// src/index.js

import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

import ProjectRoutes from './routes/project.routes.js'
import bidRoutes from './routes/bid.routes.js';
import deliverableRoutes from './routes/deliverable.routes.js';
import authRoutes from './routes/auth.routes.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: 'https://selling-buyer-backend-2.onrender.com',
    credentials: true,
  })
);
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/projects',ProjectRoutes)
app.use('/api/bids', bidRoutes);
app.use('/api/deliverables', deliverableRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
