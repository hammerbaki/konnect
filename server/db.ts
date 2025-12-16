import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

const isProduction = process.env.NODE_ENV === 'production';

// In production, use Supabase (PROD_DATABASE_URL)
// In development, use Replit's Helium database (DATABASE_URL)
let databaseUrl: string = '';

try {
  if (isProduction) {
    databaseUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL || '';
    if (!process.env.PROD_DATABASE_URL) {
      console.warn('WARNING: PROD_DATABASE_URL not set, falling back to DATABASE_URL');
    }
    console.log('Using production database (Supabase)');
  } else {
    databaseUrl = process.env.DATABASE_URL || '';
    console.log('Using development database (Replit Helium)');
  }

  if (!databaseUrl) {
    console.warn('WARNING: No database URL configured - database operations will fail');
    // Use a dummy URL that won't connect but won't crash during initialization
    databaseUrl = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
  }
} catch (err) {
  console.error('Error reading database configuration:', err);
  databaseUrl = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
}

// Configure Neon driver for WebSocket (works with both Neon and Supabase)
try {
  neonConfig.webSocketConstructor = ws;
  neonConfig.useSecureWebSocket = true;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
} catch (err) {
  console.error('Error configuring Neon driver:', err);
}

console.log('Connecting to database...');

// Track connection state
let isConnected = false;

// Initialize pool - wrap in function to handle errors gracefully
function createPool(): Pool {
  try {
    const p = new Pool({ 
      connectionString: databaseUrl,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      max: 5,
      ssl: isProduction ? { rejectUnauthorized: false } : undefined,
    });

    p.on('error', (err) => {
      // Never crash on pool errors - just log
      const isDnsError = err.message?.includes('EAI_AGAIN') || err.message?.includes('ENOTFOUND');
      if (isDnsError) {
        if (isConnected) {
          console.warn('Database connection lost (DNS error), will reconnect');
          isConnected = false;
        }
      } else {
        console.warn('Database pool error (non-fatal):', err.message);
      }
    });

    p.on('connect', () => {
      if (!isConnected) {
        console.log('✓ Database connection established');
        isConnected = true;
      }
    });
    
    console.log('✓ Database pool created');
    return p;
  } catch (err) {
    console.error('Error creating database pool:', err);
    // Return a minimal pool that will fail on queries but won't crash
    return new Pool({ 
      connectionString: 'postgresql://x:x@localhost:5432/x',
      max: 1,
    });
  }
}

export const pool = createPool();

// Initialize drizzle
let drizzleDb: ReturnType<typeof drizzle>;

try {
  drizzleDb = drizzle({ client: pool, schema });
  console.log('✓ Database connection configured');
} catch (err) {
  console.error('Error initializing Drizzle ORM:', err);
  // Create a minimal drizzle instance
  drizzleDb = drizzle({ client: pool, schema });
}

export const db = drizzleDb;
