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
  // Don't throw - let the server start anyway
}

console.log('Connecting to database...');

export const pool = new Pool({ 
  connectionString: databaseUrl,
  // Add connection error handling
  connectionTimeoutMillis: 10000, // 10 second timeout
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  // Don't crash - just log
});

pool.on('connect', () => {
  console.log('✓ Database connection established');
});

export const db = drizzle({ client: pool, schema });

console.log('✓ Database connection configured');
