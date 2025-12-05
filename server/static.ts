import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  console.log('Static files path:', distPath);
  console.log('__dirname:', __dirname);
  console.log('Directory exists:', fs.existsSync(distPath));
  
  if (!fs.existsSync(distPath)) {
    console.error(`Could not find the build directory: ${distPath}`);
    // List what's in __dirname
    try {
      const files = fs.readdirSync(__dirname);
      console.log('Files in __dirname:', files);
    } catch (e) {
      console.error('Could not read __dirname:', e);
    }
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // List files in distPath
  try {
    const files = fs.readdirSync(distPath);
    console.log('Files in public directory:', files);
  } catch (e) {
    console.error('Could not read public directory:', e);
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    console.log('Serving index.html from:', indexPath);
    res.sendFile(indexPath);
  });
}
