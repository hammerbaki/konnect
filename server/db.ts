import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import pg from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from 'ws';
import * as schema from "@shared/schema";

const isProduction = process.env.NODE_ENV === 'production';

console.log(`Using ${isProduction ? 'production (Supabase)' : 'development (Replit/Neon)'} database`);

function getDatabaseUrl(): string {
  try {
    const url = isProduction 
      ? (process.env.PROD_DATABASE_URL || process.env.DATABASE_URL || '')
      : (process.env.DATABASE_URL || '');
    if (!url) {
      console.warn('WARNING: Database URL not set');
    }
    return url;
  } catch (err) {
    console.error('Error reading database URL:', err);
    return '';
  }
}

if (!isProduction) {
  try {
    const WebSocketImpl = (ws as any).WebSocket || (ws as any).default || ws;
    if (WebSocketImpl && typeof WebSocketImpl === 'function') {
      neonConfig.webSocketConstructor = WebSocketImpl;
      neonConfig.useSecureWebSocket = true;
      neonConfig.pipelineTLS = false;
      neonConfig.pipelineConnect = false;
      console.log('✓ WebSocket configured for database');
    } else {
      console.warn('WebSocket constructor not found, using default Neon config');
    }
  } catch (err) {
    console.warn('WebSocket configuration skipped:', (err as Error).message);
  }
}

let _pool: NeonPool | pg.Pool | null = null;
let _poolInitialized = false;

function getPool(): NeonPool | pg.Pool | null {
  if (_poolInitialized) return _pool;
  _poolInitialized = true;
  
  try {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      console.warn('WARNING: No database URL configured');
      return null;
    }
    
    console.log('Connecting to database...');
    
    if (isProduction) {
      _pool = new pg.Pool({ 
        connectionString: databaseUrl,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
        max: 10,
        ssl: { rejectUnauthorized: false },
      });
      console.log('✓ Using standard pg driver for Supabase');
    } else {
      _pool = new NeonPool({ 
        connectionString: databaseUrl,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
        max: 5,
      });
      console.log('✓ Using Neon serverless driver for development');
    }

    _pool.on('error', (err: Error) => {
      console.warn('Database pool error (non-fatal):', err.message);
    });

    _pool.on('connect', () => {
      console.log('✓ Database connection established');
    });
    
    console.log('✓ Database pool created');
    return _pool;
  } catch (err) {
    console.error('Error creating database pool (non-fatal):', err);
    return null;
  }
}

export function getPoolInstance(): NeonPool | pg.Pool | null {
  return getPool();
}

export const pool = {
  get instance() {
    return getPool();
  }
};

let _db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePg> | null = null;
let _dbInitialized = false;

function getDb() {
  if (_dbInitialized && _db) return _db;
  _dbInitialized = true;
  
  const p = getPool();
  if (!p) {
    return new Proxy({} as ReturnType<typeof drizzleNeon>, {
      get(target, prop) {
        throw new Error('Database not configured - check DATABASE_URL');
      }
    });
  }
  
  try {
    if (isProduction) {
      _db = drizzlePg({ client: p as pg.Pool, schema });
      console.log('✓ Drizzle ORM configured (node-postgres)');
    } else {
      _db = drizzleNeon({ client: p as NeonPool, schema });
      console.log('✓ Drizzle ORM configured (neon-serverless)');
    }
    return _db;
  } catch (err) {
    console.error('Error initializing Drizzle ORM:', err);
    return new Proxy({} as ReturnType<typeof drizzleNeon>, {
      get(target, prop) {
        throw new Error('Drizzle ORM initialization failed');
      }
    });
  }
}

export const db = new Proxy({} as ReturnType<typeof drizzleNeon>, {
  get(target, prop) {
    const realDb = getDb();
    return (realDb as any)[prop];
  }
});
