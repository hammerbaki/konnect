import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

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
  connectionTimeoutMillis: 30000, // 30 second timeout for production stability
  idleTimeoutMillis: 30000,
  max: 10, // Maximum number of clients in the pool
});

pool.on('error', (err) => {
  // DNS errors are transient - don't log full stack trace
  if (err.message?.includes('EAI_AGAIN') || err.message?.includes('ENOTFOUND')) {
    console.error('Database DNS resolution error (will retry):', err.message);
  } else {
    console.error('Unexpected database error:', err);
  }
});

pool.on('connect', () => {
  console.log('✓ Database connection established');
});

export const db = drizzle({ client: pool, schema });

console.log('✓ Database connection configured');
