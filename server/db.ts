import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from "@shared/schema";

const isProduction = process.env.NODE_ENV === 'production';

// Log which database we're using
// Always use Replit-managed DATABASE_URL for both development and production
console.log(`Using ${isProduction ? 'production' : 'development'} database (Replit-managed)`);

// Get database URL safely - always use Replit-managed DATABASE_URL
function getDatabaseUrl(): string {
  try {
    const url = process.env.DATABASE_URL || '';
    if (!url) {
      console.warn('WARNING: DATABASE_URL not set');
    }
    return url;
  } catch (err) {
    console.error('Error reading DATABASE_URL:', err);
    return '';
  }
}

// Configure WebSocket - handle both ESM and CJS imports
try {
  // ws might be imported as default or as a named export depending on bundler
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

// Lazy pool creation - only create when first accessed
let _pool: Pool | null = null;
let _poolError: Error | null = null;
let _poolInitialized = false;

function getPool(): Pool | null {
  if (_poolInitialized) return _pool;
  _poolInitialized = true;
  
  try {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      console.warn('WARNING: No database URL configured');
      _poolError = new Error('No database URL');
      return null;
    }
    
    console.log('Connecting to database...');
    
    _pool = new Pool({ 
      connectionString: databaseUrl,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
      max: 5,
      ssl: isProduction ? { rejectUnauthorized: false } : undefined,
    });

    // Add error handler to prevent crashes
    _pool.on('error', (err) => {
      console.warn('Database pool error (non-fatal):', err.message);
    });

    _pool.on('connect', () => {
      console.log('✓ Database connection established');
    });
    
    console.log('✓ Database pool created');
    return _pool;
  } catch (err) {
    console.error('Error creating database pool (non-fatal):', err);
    _poolError = err as Error;
    return null;
  }
}

// Export pool - lazy initialization
export function getPoolInstance(): Pool | null {
  return getPool();
}

// For backwards compatibility
export const pool = {
  get instance() {
    return getPool();
  }
};

// Create a proxy that lazily initializes drizzle
let _db: ReturnType<typeof drizzle> | null = null;
let _dbInitialized = false;

function getDb(): ReturnType<typeof drizzle> {
  if (_dbInitialized && _db) return _db;
  _dbInitialized = true;
  
  const p = getPool();
  if (!p) {
    // Return a proxy that throws on access if no pool
    return new Proxy({} as ReturnType<typeof drizzle>, {
      get(target, prop) {
        throw new Error('Database not configured - check DATABASE_URL');
      }
    });
  }
  
  try {
    _db = drizzle({ client: p, schema });
    console.log('✓ Database connection configured');
    return _db;
  } catch (err) {
    console.error('Error initializing Drizzle ORM:', err);
    // Return proxy that throws
    return new Proxy({} as ReturnType<typeof drizzle>, {
      get(target, prop) {
        throw new Error('Drizzle ORM initialization failed');
      }
    });
  }
}

// Export db as a getter to enable lazy initialization
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const realDb = getDb();
    return (realDb as any)[prop];
  }
});
