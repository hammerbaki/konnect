import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for serverless with WebSocket
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;

// Use fallback connection string if DATABASE_URL is not set
const databaseUrl = process.env.DATABASE_URL || 'postgresql://fallback:fallback@localhost:5432/fallback';

if (!process.env.DATABASE_URL) {
  console.error('CRITICAL: DATABASE_URL environment variable is not set');
  console.error('Using fallback connection - database operations will fail');
  console.error('Please configure your database in the deployment settings');
}

console.log('Connecting to database...');

export const pool = new Pool({ 
  connectionString: databaseUrl,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 10,
});

// Track connection state
let isConnected = false;

pool.on('error', (err) => {
  const isDnsError = err.message?.includes('EAI_AGAIN') || err.message?.includes('ENOTFOUND');
  if (isDnsError) {
    // DNS errors are transient in Replit production - log minimally
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
