import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { config } from './config/config';
import { initDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import notesRoutes from './routes/noteRoutes'
import path from "path";

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.port;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://accounts.google.com",
        "https://apis.google.com",
        "https://www.gstatic.com", // Added for Google Sign-In
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://accounts.google.com",
        "https://fonts.googleapis.com", // Added for Google fonts if needed
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:",
        "https://lh3.googleusercontent.com", // Added for Google profile images
      ],
      connectSrc: [
        "'self'", 
        "https://accounts.google.com",
        "https://oauth2.googleapis.com",
        "https://www.googleapis.com", // Added for Google API calls
      ],
      frameSrc: [
        "'self'",
        "https://accounts.google.com",
      ],
      frameAncestors: ["'none'"],
      childSrc: ["'self'", "https://accounts.google.com"],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com", // Added for Google fonts if needed
      ],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - UPDATED
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === "production"
      ? [
          'https://hd-server-77ro.onrender.com',
          'https://accounts.google.com',
          'https://www.googleapis.com'
        ]
      : [
          config.frontend.url,
          'http://localhost:5173',
          'http://localhost:3000',
          'https://accounts.google.com',
          'https://www.googleapis.com'
        ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200, // For legacy browser support
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

if (process.env.NODE_ENV === "production") {
  const __dirname1 = path.resolve();
  // From compiled dist/server.js, go to src/dist
  const staticPath = path.join(__dirname1, "src/dist");
  
  console.log("🔍 Debug info:");
  console.log("__dirname1:", __dirname1);
  console.log("Static path:", staticPath);
  console.log("NODE_ENV:", process.env.NODE_ENV);
  
  const fs = require('fs');
  console.log("Static path exists:", fs.existsSync(staticPath));
  console.log("index.html exists:", fs.existsSync(path.join(staticPath, "index.html")));
  
  app.use(express.static(staticPath));
  
  app.get("*", (req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    console.log("Serving index.html from:", indexPath);
    res.sendFile(indexPath);
  });
}

// 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found',
//   });
// });

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database tables
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`
🚀 Server is running!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🏥 Health check: http://localhost:${PORT}/health
🎨 Frontend URL: ${config.frontend.url}
🔐 Google Client ID configured: ${!!process.env.GOOGLE_CLIENT_ID}
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();