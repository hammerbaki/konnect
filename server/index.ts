import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import helmet from "helmet";
import compression from "compression";
import { generateMajorDescriptions, generateJobDescriptions, enrichMajorRelatedData, enrichMajorCareerNetData, refillEmptyRelatedMajors, syncCareerMajorSeq, syncJobsFromCareerNetNew, syncMajorsFromCareerNetNew } from "./dataSync";
import { syncUniversityApi } from "./universityApiSync";
import { db } from "./db";
import { sql } from "drizzle-orm";

// CORS configuration for mobile apps and web clients
function configureCORS(app: express.Express) {
  const allowedOrigins = [
    'https://konnect.careers',
    'https://www.konnect.careers',
    'http://localhost:19006',  // Expo web dev
    'http://localhost:8081',   // Expo/Metro
    'http://localhost:3000',   // Local dev
    'http://localhost:5000',
    'capacitor://localhost',   // iOS Capacitor
    'http://localhost',        // Android Capacitor
  ];

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Allow requests with no Origin header (mobile apps, server-to-server)
    if (!origin) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV !== 'production') {
      // In development, allow all origins for testing
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours cache
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    next();
  });
  
  console.log('✓ CORS configured for mobile apps and web clients');
}

// Validate critical environment variables (log warnings but don't exit)
function validateEnvironment() {
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`WARNING: Missing environment variables: ${missing.join(', ')}`);
    console.error('The application may not function correctly.');
    console.error('Please ensure DATABASE_URL is configured in your deployment settings.');
    // Don't exit - let the app try to start anyway
  } else {
    console.log('✓ Environment variables validated');
  }

  // Warn about SESSION_SECRET but don't crash if missing (it's set automatically in production)
  if (!process.env.SESSION_SECRET) {
    console.warn('WARNING: SESSION_SECRET not found. It should be auto-configured by Replit.');
  }
}

validateEnvironment();

const app = express();
const httpServer = createServer(app);

// CORS must be configured FIRST before other middleware
configureCORS(app);

// Security: Disable X-Powered-By header
app.disable('x-powered-by');

// Security: Add Helmet for security headers
// CSP configured to allow Supabase auth and necessary resources
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.tosspayments.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://accounts.google.com",
        "https://apis.google.com",
        "https://api.tosspayments.com",
        "https://*.tosspayments.com",
      ],
      frameSrc: ["'self'", "https://*.supabase.co", "https://accounts.google.com", "https://*.tosspayments.com"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

// Performance: Enable gzip compression
app.use(compression());

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep server running
});

app.use(
  express.json({
    limit: '5mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Skip logging body entirely for large data endpoints
      const skipLogPaths = ['/api/careers'];
      const shouldSkipBody = skipLogPaths.some(p => path.startsWith(p));
      
      if (shouldSkipBody && capturedJsonResponse) {
        const count = Array.isArray(capturedJsonResponse) ? capturedJsonResponse.length : 1;
        logLine += ` :: [${count} items]`;
      } else if (capturedJsonResponse) {
        // Only log small responses (max 200 chars) to prevent memory issues
        const jsonStr = JSON.stringify(capturedJsonResponse);
        if (jsonStr.length > 200) {
          // Just log the type and size, not content
          const type = Array.isArray(capturedJsonResponse) ? 'array' : 'object';
          const size = Array.isArray(capturedJsonResponse) ? capturedJsonResponse.length : Object.keys(capturedJsonResponse).length;
          logLine += ` :: [${type}:${size}]`;
        } else {
          logLine += ` :: ${jsonStr}`;
        }
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('Starting server initialization...');
    
    const server = await registerRoutes(app);
    console.log('✓ Routes registered');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error(`Error ${status}:`, message);
      res.status(status).json({ message });
      // Don't throw - just log
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      console.log('Setting up static file serving for production...');
      serveStatic(app);
      console.log('✓ Static files configured');
    } else {
      console.log('Setting up Vite for development...');
      const { setupVite } = await import("./vite");
      await setupVite(server, app);
      console.log('✓ Vite configured');
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "5000", 10);
    const host = "0.0.0.0"; // Required for autoscale
    
    server.listen(
      {
        port,
        host,
        reusePort: true,
      },
      () => {
        log(`serving on port ${port} (host: ${host})`);
        console.log('✓ Server ready');

        // Background: initial seed + generate missing descriptions via GPT-4o-mini
        setTimeout(async () => {
          try {
            // ── Step 0: Initial seed if tables are empty ──
            const countCheck = await db.execute(sql`
              SELECT
                (SELECT COUNT(*) FROM cached_majors) AS majors,
                (SELECT COUNT(*) FROM cached_jobs) AS jobs,
                (SELECT COUNT(*) FROM university_info) AS universities
            `);
            const counts = (countCheck as any).rows?.[0] ?? {};
            const majorsCount = parseInt(counts.majors ?? '0');
            const jobsCount = parseInt(counts.jobs ?? '0');
            const univCount = parseInt(counts.universities ?? '0');

            if (majorsCount === 0) {
              console.log('[DataSync] cached_majors is empty — running initial CareerNet sync...');
              try {
                const r = await syncMajorsFromCareerNetNew((m) => console.log('[InitSync Majors]', m));
                console.log('[DataSync] Initial major sync done:', r);
              } catch (e) { console.error('[DataSync] Major initial sync error:', e); }
            }

            if (jobsCount === 0) {
              console.log('[DataSync] cached_jobs is empty — running initial CareerNet sync...');
              try {
                const r = await syncJobsFromCareerNetNew((m) => console.log('[InitSync Jobs]', m));
                console.log('[DataSync] Initial job sync done:', r);
              } catch (e) { console.error('[DataSync] Job initial sync error:', e); }
            }

            if (univCount === 0) {
              console.log('[DataSync] university_info is empty — running initial university API sync...');
              try {
                const r = await syncUniversityApi();
                console.log('[DataSync] Initial university sync done:', r);
              } catch (e) { console.error('[DataSync] University initial sync error:', e); }
            }
            // ─────────────────────────────────────────────

            const check = await db.execute(sql`
              SELECT COUNT(*) as missing FROM cached_majors
              WHERE description IS NULL OR description = ''
            `);
            const missing = parseInt((check as any).rows?.[0]?.missing ?? '0');
            if (missing > 0) {
              console.log(`[DataSync] ${missing} majors missing descriptions — starting GPT generation...`);
              const majorResult = await generateMajorDescriptions((m) => console.log('[DataSync Major]', m));
              console.log('[DataSync] Major result:', majorResult);
            } else {
              console.log('[DataSync] All major descriptions present — skipping.');
            }

            const jobCheck = await db.execute(sql`
              SELECT COUNT(*) as missing FROM cached_jobs
              WHERE description IS NULL OR description = ''
            `);
            const jobMissing = parseInt((jobCheck as any).rows?.[0]?.missing ?? '0');
            if (jobMissing > 0) {
              console.log(`[DataSync] ${jobMissing} jobs missing descriptions — generating via GPT...`);
              const jobResult = await generateJobDescriptions((m) => console.log('[DataSync Job]', m));
              console.log('[DataSync] Job result:', jobResult);
            } else {
              console.log('[DataSync] All job descriptions present — skipping.');
            }

            // Enrich demand + related jobs for majors that need it
            const enrichCheck = await db.execute(sql`
              SELECT COUNT(*) as cnt FROM cached_majors
              WHERE (demand IS NULL OR demand = '')
                 OR (related_jobs IS NULL OR jsonb_array_length(related_jobs) <= 3)
            `);
            const needsEnrich = parseInt((enrichCheck as any).rows?.[0]?.cnt ?? '0');
            if (needsEnrich > 0) {
              console.log(`[DataSync] ${needsEnrich} majors need demand/jobs enrichment — starting...`);
              const enrichResult = await enrichMajorRelatedData((m) => console.log('[DataSync Enrich]', m));
              console.log('[DataSync] Enrich result:', enrichResult);
            } else {
              console.log('[DataSync] All major demand/jobs data complete — skipping enrichment.');
            }

            // Enrich per-major employment rate + salary from CareerNet MAJOR_VIEW
            const careerNetResult = await enrichMajorCareerNetData(
              (m) => console.log('[DataSync CareerNet]', m)
            );
            console.log('[DataSync] CareerNet major data result:', careerNetResult);

            // Refill empty related_majors for jobs (Stage 2)
            const refillResult = await refillEmptyRelatedMajors(
              (m) => console.log('[DataSync RefillMajors]', m)
            );
            console.log('[DataSync] Refill related_majors result:', refillResult);

            // Sync career_major_seq for cached_majors (Stage 3)
            const seqResult = await syncCareerMajorSeq(
              (m) => console.log('[DataSync CareerMajorSeq]', m)
            );
            console.log('[DataSync] career_major_seq sync result:', seqResult);
          } catch (e) {
            console.error('[DataSync] Background sync error:', e);
          }
        }, 5000); // Wait 5s after server starts

        // ── Periodic re-sync: CareerNet data refreshed every 7 days ──
        // Clients are always served from our DB; this keeps the DB fresh.
        const RESYNC_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
        let periodicSyncRunning = false;

        setInterval(async () => {
          if (periodicSyncRunning) {
            console.log('[PeriodicSync] Previous sync still running — skipping.');
            return;
          }
          periodicSyncRunning = true;
          console.log('[PeriodicSync] Starting weekly CareerNet data refresh...');
          try {
            const majResult = await syncMajorsFromCareerNetNew((m) => console.log('[PeriodicSync Majors]', m));
            console.log('[PeriodicSync] Majors done:', majResult);
            const jobResult = await syncJobsFromCareerNetNew((m) => console.log('[PeriodicSync Jobs]', m));
            console.log('[PeriodicSync] Jobs done:', jobResult);
            console.log('[PeriodicSync] Weekly refresh complete.');
          } catch (e) {
            console.error('[PeriodicSync] Error during weekly refresh:', e);
          } finally {
            periodicSyncRunning = false;
          }
        }, RESYNC_INTERVAL_MS);
      },
    );

    // Handle server errors
    server.on('error', (error: any) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
      }
    });

  } catch (error) {
    console.error('CRITICAL: Failed to start server:', error);
    // Log the full error stack for debugging
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    // Try to start a minimal server even if initialization failed
    console.error('Attempting to start minimal server for debugging...');
    
    try {
      const port = parseInt(process.env.PORT || "5000", 10);
      const host = "0.0.0.0";
      
      // Create a minimal error-reporting server
      httpServer.listen({ port, host, reusePort: true }, () => {
        console.log(`Minimal server running on ${host}:${port}`);
        console.log('Server is in degraded mode due to initialization errors');
      });
      
      // Add basic health check route
      app.get('/health', (_req, res) => {
        res.status(503).json({ 
          status: 'degraded',
          error: 'Server initialization failed',
          message: 'Check logs for details'
        });
      });
    } catch (fallbackError) {
      console.error('Failed to start even minimal server:', fallbackError);
      // Keep trying - never exit
      console.error('Server will remain in failed state - check configuration');
    }
  }
})();
