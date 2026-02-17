// backend/src/app.js - VERSIÓN FINAL
import 'dotenv/config'; 
import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import tasksRoutes from './routes/tasks.routes.js'
import appointmentRoutes from './routes/appointment.routes.js'
import ownerRoutes from './routes/owner.routes.js'
import petRoutes from './routes/pet.routes.js'
import availabilityRoutes from './routes/availability.routes.js';

import { ALLOWED_ORIGINS } from "./config.js";

const app = express();

app.set("trust proxy", 1);

// ✅ CORS COMPLETO PARA EXPO
app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sin origen (como mobile apps o curl)
      if (!origin) return callback(null, true);
      
      console.log('🌐 Origen de request:', origin);
      
      if (ALLOWED_ORIGINS.some(pattern => {
        if (typeof pattern === 'string') {
          return origin === pattern;
        } else if (pattern instanceof RegExp) {
          return pattern.test(origin);
        }
        return false;
      })) {
        console.log('✅ Origen permitido:', origin);
        callback(null, true);
      } else {
        console.log('❌ Origen bloqueado:', origin);
        // PERO permitimos de todos modos para desarrollo
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "X-Platform"
    ],
    exposedHeaders: ["Set-Cookie"],
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Rutas
app.use("/api", authRoutes);
app.use("/api", tasksRoutes);
app.use("/api", appointmentRoutes);
app.use("/api", ownerRoutes);
app.use("/api", petRoutes);
app.use("/api", availabilityRoutes);
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend API',
    version: '1.0.0',
    endpoints: [
      '/api/login',
      '/api/register',
      '/api/owners',
      '/api/pets',
      '/api/appointments'
    ]
  });
});

export default app;