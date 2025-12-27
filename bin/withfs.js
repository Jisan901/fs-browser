#!/usr/bin/env node

/**
 * withfs - CLI utility to serve built projects with fs API support
 * Usage: withfs [projectDir] [options]
 */

import http from 'http';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseUrl } from 'url';
import { exec } from 'child_process';
import { createFsHandlers } from '../plugin/fs-handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let projectDir = '.';
let host = 'localhost';
let port = 3000;
let baseDir = './data';
let apiPrefix = '/api/fs';
let openBrowser = false;
let justFs = false;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--host' || arg === '-h') {
    const next = args[i + 1];
    if (next && !next.startsWith('-')) {
      host = next;
      i++;
    } else {
      host = '0.0.0.0';
    }
  } else if (arg === '--port' || arg === '-p') {
    port = parseInt(args[++i]) || 3000;
  } else if (arg === '--base-dir' || arg === '-b') {
    baseDir = args[++i] || './data';
  } else if (arg === '--api-prefix' || arg === '-a') {
    apiPrefix = args[++i] || '/api/fs';
  } else if (arg === '--open' || arg === '-o') {
    openBrowser = true;
  } else if (arg === '--justfs') {
    justFs = true;
  } else if (arg === '--help') {
    showHelp();
    process.exit(0);
  } else if (!arg.startsWith('-')) {
    projectDir = arg;
  }
}

// Resolve paths
const PROJECT_DIR = path.resolve(process.cwd(), projectDir);
const BASE_DIR = path.resolve(PROJECT_DIR, baseDir);

// Ensure directories exist
if (!justFs && !fsSync.existsSync(PROJECT_DIR)) {
  console.error(`Error: Project directory not found: ${PROJECT_DIR}`);
  process.exit(1);
}

if (!fsSync.existsSync(BASE_DIR)) {
  fsSync.mkdirSync(BASE_DIR, { recursive: true });
}

// Create FS handlers
const fsHandlers = createFsHandlers(BASE_DIR);

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.wasm': 'application/wasm'
};



// Serve static files
async function serveStaticFile(req, res) {
  const parsedUrl = parseUrl(req.url);
  let pathname = parsedUrl.pathname;
  
  // Default to index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(PROJECT_DIR, pathname);
  
  // Security check
  if (!filePath.startsWith(PROJECT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  try {
    const stats = await fs.stat(filePath);
    
    if (stats.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      if (fsSync.existsSync(indexPath)) {
        const content = await fs.readFile(indexPath);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
      return;
    }
    
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    const content = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  }
}

// Create server
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  try {
    // Handle FS API routes
    if (req.url.startsWith(apiPrefix)) {
      const routePath = req.url.substring(apiPrefix.length) || '/';
      const handlerKey = `${req.method} ${routePath.split('?')[0]}`;
      const handler = fsHandlers[handlerKey];
      
      if (handler) {
        await handler(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found' }));
      }
    } 
    // Serve static files (only if not in justFs mode)
    else if (!justFs) {
      await serveStaticFile(req, res);
    }
    // In justFs mode, reject non-API requests
    else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Not Found',
        message: 'Running in --justfs mode. Only fs API endpoints are available.'
      }));
    }
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: {
        message: error.message,
        status: 500
      }
    }));
  }
});

// Start server
server.listen(port, host, () => {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log(`│  🚀 withfs - ${justFs ? 'FS API Server' : 'Server Running'}          │`);
  console.log('└─────────────────────────────────────────┘\n');
  if (!justFs) {
    console.log(`  Project:     ${PROJECT_DIR}`);
  }
  console.log(`  Local:       http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
  if (host === '0.0.0.0') {
    console.log(`  Network:     http://<your-ip>:${port}`);
  }
  console.log(`  FS API:      ${apiPrefix}`);
  console.log(`  Base Dir:    ${BASE_DIR}`);
  if (justFs) {
    console.log(`  Mode:        Just FS (no static files)`);
  }
  console.log('\n  Press Ctrl+C to stop\n');
  
  if (openBrowser && !justFs) {
    const url = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;
    const start = process.platform === 'darwin' ? 'open' : 
                  process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${start} ${url}`);
  }
});

// Help text
function showHelp() {
  console.log(`
withfs - Serve built projects with fs API support

USAGE:
  withfs [projectDir] [options]

OPTIONS:
  --host, -h [host]          Host to bind to (default: localhost, --host alone = 0.0.0.0)
  --port, -p <port>          Port to use (default: 3000)
  --base-dir, -b <dir>       Base directory for fs operations (default: ./data)
  --api-prefix, -a <prefix>  API route prefix (default: /api/fs)
  --open, -o                 Open browser automatically
  --justfs                   Only run fs API (no static file serving)
  --help                     Show this help message

EXAMPLES:
  withfs                     # Serve current directory
  withfs ./dist              # Serve dist directory
  withfs --host              # Serve on all interfaces (0.0.0.0)
  withfs --port 8080         # Use custom port
  withfs --open              # Open browser automatically
  withfs --justfs            # Only fs API, no static files
  withfs --justfs --port 5001  # Dedicated fs API server

AFTER BUILD WORKFLOW:
  npm run build
  withfs ./dist --host --open

JUST FS MODE:
  # Run only fs API without static file serving
  withfs --justfs --port 5001
  # Useful for microservices or separate frontend servers
  `);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n  👋 Shutting down server...\n');
  server.close(() => {
    process.exit(0);
  });
});