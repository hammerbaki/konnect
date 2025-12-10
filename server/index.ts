import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

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

app.use(express.urlencoded({ extended: false, limit: '5mb' }));

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
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
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
      // Only exit if we absolutely cannot start any server
      setTimeout(() => process.exit(1), 5000); // Give 5 seconds for logs to flush
    }
  }
})();
