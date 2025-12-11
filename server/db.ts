import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

const isProduction = process.env.NODE_ENV === 'production';

// In production, use Supabase (PROD_DATABASE_URL)
// In development, use Replit's Helium database (DATABASE_URL)
let databaseUrl: string;

if (isProduction) {
  databaseUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL || '';
  if (!process.env.PROD_DATABASE_URL) {
    console.error('WARNING: PROD_DATABASE_URL not set, falling back to DATABASE_URL');
  }
  console.log('Using production database (Supabase)');
} else {
  databaseUrl = process.env.DATABASE_URL || '';
  console.log('Using development database (Replit Helium)');
}

if (!databaseUrl) {
  console.error('CRITICAL: No database URL configured');
  databaseUrl = 'postgresql://fallback:fallback@localhost:5432/fallback';
}

// Configure Neon driver for WebSocket (works with both Neon and Supabase)
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;

console.log('Connecting to database...');

export const pool = new Pool({ 
  connectionString: databaseUrl,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
  max: 5, // Reduced pool size to prevent connection exhaustion
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});

// Track connection state
let isConnected = false;

pool.on('error', (err) => {
  const isDnsError = err.message?.includes('EAI_AGAIN') || err.message?.includes('ENOTFOUND');
  if (isDnsError) {
    if (isConnected) {
      console.error('Database connection lost (DNS error), will reconnect');
      isConnected = false;
    }
  } else {
    console.error('Unexpected database error:', err.message);
  }
});

pool.on('connect', () => {
  if (!isConnected) {
    console.log('✓ Database connection established');
    isConnected = true;
  }
});

export const db = drizzle({ client: pool, schema });

console.log('✓ Database connection configured');
