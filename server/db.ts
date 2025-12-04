import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is not set');
  console.error('Please configure your database in the deployment settings');
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Connecting to database...');

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Add connection error handling
  connectionTimeoutMillis: 10000, // 10 second timeout
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export const db = drizzle({ client: pool, schema });

console.log('✓ Database connection configured');
