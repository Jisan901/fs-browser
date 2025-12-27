/**
 * Shared FS API handlers for both Vite plugin and withfs CLI
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Helper to read raw body from request
 */
export const getRawBody = (req) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
};

/**
 * Helper to parse query string
 */
export const parseQuery = (url) => {
  const queryString = url.split('?')[1];
  if (!queryString) return {};
  return Object.fromEntries(new URLSearchParams(queryString));
};

/**
 * Create path resolver with base directory restriction
 */
export const createPathResolver = (baseDir) => {
  return (filePath) => {
    // Remove leading slash to treat all paths as relative
    const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const resolved = path.resolve(baseDir, normalizedPath);
    if (!resolved.startsWith(baseDir)) {
      throw new Error('Invalid path: outside base directory');
    }
    return resolved;
  };
};

/**
 * Create FS API handlers
 * @param {string} baseDir - Base directory for file operations
 * @returns {Object} - Handler functions mapped by route key
 */
export const createFsHandlers = (baseDir) => {
  const resolvePath = createPathResolver(baseDir);

  return {
    // Root endpoint
    'GET /': async (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'fs-browser API',
        baseDirectory: baseDir
      }));
    },

    // List all methods
    'GET /methods': async (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        methods: [
          'readFile', 'writeFile', 'appendFile', 'copyFile',
          'readdir', 'mkdir', 'rmdir', 'rm',
          'rename', 'unlink',
          'stat', 'lstat', 'readlink', 'realpath'
        ]
      }));
    },

    // Read file
    'GET /readFile': async (req, res) => {
      const query = parseQuery(req.url);
      const { path: filePath, encoding = 'utf8' } = query;
      const fullPath = resolvePath(filePath);
      const data = await fs.readFile(fullPath, encoding);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data }));
    },

    // Read directory
    'GET /readdir': async (req, res) => {
      const query = parseQuery(req.url);
      const { path: dirPath = '.', withFileTypes = 'false' } = query;
      const fullPath = resolvePath(dirPath);
      const files = await fs.readdir(fullPath, { 
        withFileTypes: withFileTypes === 'true' 
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ files }));
    },

    // Get file stats
    'GET /stat': async (req, res) => {
      const query = parseQuery(req.url);
      const { path: filePath } = query;
      const fullPath = resolvePath(filePath);
      const stats = await fs.stat(fullPath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        stats: {
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          isSymbolicLink: stats.isSymbolicLink(),
          size: stats.size,
          mode: stats.mode,
          mtime: stats.mtime,
          atime: stats.atime,
          ctime: stats.ctime,
          birthtime: stats.birthtime
        }
      }));
    },

    // Get file stats (no symlink follow)
    'GET /lstat': async (req, res) => {
      const query = parseQuery(req.url);
      const { path: filePath } = query;
      const fullPath = resolvePath(filePath);
      const stats = await fs.lstat(fullPath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        stats: {
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          isSymbolicLink: stats.isSymbolicLink(),
          size: stats.size,
          mode: stats.mode,
          mtime: stats.mtime,
          atime: stats.atime,
          ctime: stats.ctime,
          birthtime: stats.birthtime
        }
      }));
    },

    // Get real path
    'GET /realpath': async (req, res) => {
      const query = parseQuery(req.url);
      const { path: filePath } = query;
      const fullPath = resolvePath(filePath);
      const realPath = await fs.realpath(fullPath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ realPath }));
    },

    // Read symlink
    'GET /readlink': async (req, res) => {
      const query = parseQuery(req.url);
      const { path: linkPath } = query;
      const fullPath = resolvePath(linkPath);
      const target = await fs.readlink(fullPath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ target }));
    },

    // Write file
    'POST /writeFile': async (req, res) => {
      const contentType = req.headers['content-type'] || '';
      const query = parseQuery(req.url);
      let filePath = query.path;
      let writeData;
      let type;

      const rawBody = await getRawBody(req);

      // Handle binary content types
      if (contentType.includes('application/octet-stream') || 
          contentType.includes('image/') || 
          contentType.includes('video/') ||
          contentType.includes('audio/') ||
          contentType.includes('application/pdf')) {
        writeData = rawBody;
        type = 'binary';
      } 
      // Handle plain text
      else if (contentType.includes('text/plain')) {
        writeData = rawBody;
        type = 'text';
      }
      // Handle JSON
      else if (contentType.includes('application/json')) {
        // If path is in query string, treat rawBody as the content to write
        if (filePath) {
          writeData = rawBody;
          type = 'json';
        } 
        // Otherwise, parse as structured request body
        else {
          if (rawBody.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Empty request body' }));
            return;
          }

          const body = JSON.parse(rawBody.toString());
          filePath = body.path;
          
          if (!filePath) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Path is required' }));
            return;
          }

          const { data, type: dataType = 'text', encoding = 'utf8' } = body;
          
          if (data === undefined || data === null) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Data is required' }));
            return;
          }
          
          type = dataType;

          switch (dataType) {
            case 'text':
              writeData = Buffer.from(String(data), encoding);
              break;
            case 'json':
              writeData = Buffer.from(JSON.stringify(data, null, 2), encoding);
              break;
            case 'buffer':
              writeData = Array.isArray(data) ? Buffer.from(data) : Buffer.from(data, 'base64');
              break;
            default:
              writeData = Buffer.from(String(data), encoding);
          }
        }
      }
      // Fallback for unknown content types
      else {
        writeData = rawBody;
        type = 'unknown';
      }

      // Validate we have data to write
      if (!writeData || writeData.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No data to write' }));
        return;
      }

      const fullPath = resolvePath(filePath);
      await fs.writeFile(fullPath, writeData);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'File written successfully', 
        path: filePath,
        type,
        size: writeData.length
      }));
    },

    // Append file
    'POST /appendFile': async (req, res) => {
      const contentType = req.headers['content-type'] || '';
      const query = parseQuery(req.url);
      let filePath = query.path;
      let appendData;
      let type;

      const rawBody = await getRawBody(req);

      // Handle binary content types
      if (contentType.includes('application/octet-stream') || 
          contentType.includes('image/') || 
          contentType.includes('video/') ||
          contentType.includes('audio/') ||
          contentType.includes('application/pdf')) {
        appendData = rawBody;
        type = 'binary';
      } 
      // Handle plain text
      else if (contentType.includes('text/plain')) {
        appendData = rawBody;
        type = 'text';
      }
      // Handle JSON
      else if (contentType.includes('application/json')) {
        // If path is in query string, treat rawBody as the content to append
        if (filePath) {
          appendData = rawBody;
          type = 'json';
        }
        // Otherwise, parse as structured request body
        else {
          if (rawBody.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Empty request body' }));
            return;
          }

          const body = JSON.parse(rawBody.toString());
          filePath = body.path;
          
          if (!filePath) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Path is required' }));
            return;
          }

          const { data, type: dataType = 'text', encoding = 'utf8' } = body;
          
          if (data === undefined || data === null) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Data is required' }));
            return;
          }
          
          type = dataType;

          switch (dataType) {
            case 'text':
              appendData = Buffer.from(String(data), encoding);
              break;
            case 'json':
              appendData = Buffer.from(JSON.stringify(data, null, 2), encoding);
              break;
            case 'buffer':
              appendData = Array.isArray(data) ? Buffer.from(data) : Buffer.from(data, 'base64');
              break;
            default:
              appendData = Buffer.from(String(data), encoding);
          }
        }
      }
      // Fallback
      else {
        appendData = rawBody;
        type = 'unknown';
      }

      // Validate we have data
      if (!appendData || appendData.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No data to append' }));
        return;
      }

      const fullPath = resolvePath(filePath);
      await fs.appendFile(fullPath, appendData);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Data appended successfully', 
        path: filePath,
        type,
        size: appendData.length
      }));
    },

    // Copy file
    'POST /copyFile': async (req, res) => {
      const rawBody = await getRawBody(req);
      const { src, dest, flags = 0 } = JSON.parse(rawBody.toString());
      const srcPath = resolvePath(src);
      const destPath = resolvePath(dest);
      await fs.copyFile(srcPath, destPath, flags);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'File copied successfully', src, dest }));
    },

    // Create directory
    'POST /mkdir': async (req, res) => {
      const rawBody = await getRawBody(req);
      const { path: dirPath, recursive = true } = JSON.parse(rawBody.toString());
      const fullPath = resolvePath(dirPath);
      await fs.mkdir(fullPath, { recursive });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Directory created', path: dirPath }));
    },

    // Remove directory
    'DELETE /rmdir': async (req, res) => {
      const rawBody = await getRawBody(req);
      const { path: dirPath, recursive = false } = JSON.parse(rawBody.toString());
      const fullPath = resolvePath(dirPath);
      await fs.rmdir(fullPath, { recursive });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Directory removed', path: dirPath }));
    },

    // Remove file or directory
    'DELETE /rm': async (req, res) => {
      const rawBody = await getRawBody(req);
      const { path: targetPath, recursive = false, force = false } = JSON.parse(rawBody.toString());
      const fullPath = resolvePath(targetPath);
      await fs.rm(fullPath, { recursive, force });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Removed successfully', path: targetPath }));
    },

    // Rename
    'PUT /rename': async (req, res) => {
      const rawBody = await getRawBody(req);
      const { oldPath, newPath } = JSON.parse(rawBody.toString());
      const oldFullPath = resolvePath(oldPath);
      const newFullPath = resolvePath(newPath);
      await fs.rename(oldFullPath, newFullPath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Renamed successfully', oldPath, newPath }));
    },

    // Delete file
    'DELETE /unlink': async (req, res) => {
      const rawBody = await getRawBody(req);
      const { path: filePath } = JSON.parse(rawBody.toString());
      const fullPath = resolvePath(filePath);
      await fs.unlink(fullPath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'File deleted', path: filePath }));
    }
  };
};