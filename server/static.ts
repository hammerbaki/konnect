import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  
  if (!fs.existsSync(distPath)) {
    console.error(`WARNING: Build directory not found: ${distPath}`);
    console.error('Static files will not be served. Make sure to build the client first.');
    
    // Serve a fallback error page instead of crashing
    app.use("*", (_req, res) => {
      res.status(503).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Service Starting</title></head>
          <body>
            <h1>Service is starting up...</h1>
            <p>The application is initializing. Please refresh in a few seconds.</p>
          </body>
        </html>
      `);
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
