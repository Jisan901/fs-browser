import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createFsHandlers } from './fs-handlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite plugin that adds filesystem API routes to the dev server
 * @param {Object} options - Plugin options
 * @param {string} options.baseDir - Base directory for file operations (default: './data')
 * @param {string} options.apiPrefix - API route prefix (default: '/api/fs')
 */
export default function vitePluginFsApi(options = {}) {
  const BASE_DIR = path.resolve(process.cwd(), options.baseDir || './data');
  const API_PREFIX = options.apiPrefix || '/api/fs';

  // Ensure base directory exists
  if (!fsSync.existsSync(BASE_DIR)) {
    fsSync.mkdirSync(BASE_DIR, { recursive: true });
  }


  // Route handlers
  const handlers = createFsHandlers(BASE_DIR);

  return {
    name: 'vite-plugin-fs-api',
    
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Only handle our API routes
        if (!req.url.startsWith(API_PREFIX)) {
          return next();
        }

        try {
          // Remove API prefix from URL
          const routePath = req.url.substring(API_PREFIX.length) || '/';
          const handlerKey = `${req.method} ${routePath.split('?')[0]}`;
          
          const handler = handlers[handlerKey];
          
          if (handler) {
            await handler(req, res);
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Route not found' }));
          }
        } catch (error) {
          console.error('FS API Error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: {
              message: error.message,
              status: 500
            }
          }));
        }
      });

      console.log(`\n  FS API available at: ${API_PREFIX}`);
      console.log(`  Base directory: ${BASE_DIR}\n`);
    }
  };
}