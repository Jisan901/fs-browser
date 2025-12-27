# fs-browser

Browser-compatible filesystem API with Vite plugin support. Write Node.js-style fs code that works in the browser!

## Features

- 🚀 Node.js-like fs API for the browser
- 🔌 Vite plugin for seamless integration
- 📦 Supports all major file operations
- 💪 Full TypeScript support
- 🎯 Handles text, JSON, binary, and Blob data
- 🔒 Safe path resolution with base directory protection

## Installation

```bash
npm install fs-browser
```

## Quick Start

### Development with Vite

**1. Setup Vite Plugin**

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import fsPlugin from 'fs-browser/plugin';

export default defineConfig({
  plugins: [
    fsPlugin({
      baseDir: './data',      // Base directory for file operations
      apiPrefix: '/api/fs'    // API route prefix
    })
  ]
});
```

**2. Use in Browser Code**

```javascript
import { readFile, writeFile, mkdir } from 'fs-browser';

// Write a file
await writeFile('hello.txt', 'Hello World!');

// Read a file
const content = await readFile('hello.txt');
console.log(content); // "Hello World!"

// Create directory
await mkdir('myFolder', { recursive: true });

// Write JSON
await writeFile('data.json', { name: 'John', age: 30 });

// Write binary data
const blob = new Blob([imageData], { type: 'image/png' });
await writeFile('image.png', blob);



fs.configure({ 
  apiBase: 'http://localhost:2300/api/fs' 
});



```


### Production - Serve Built Projects

After building your project, use the `withfs` CLI to serve it with fs API support:

```bash
# Build your project
npm run build

# Serve with fs API support
withfs ./dist --host

# Or with custom options
withfs ./dist --host --port 8080 --open
```

**CLI Options:**
```bash
withfs [projectDir] [options]

Options:
  --host, -h <host>          Host (default: localhost, use --host for 0.0.0.0)
  --port, -p <port>          Port (default: 3000)
  --base-dir, -b <dir>       Base dir for fs operations (default: ./data)
  --api-prefix, -a <prefix>  API route prefix (default: /api/fs)
  --open, -o                 Open browser automatically
  --justfs                   Only run fs API (no static file serving)
  --help                     Show help message
```

**Example Workflow:**
```bash
# Development
npm run dev

# Build
npm run build

# Production serve with fs API
withfs ./dist --host --open
```


## Development with Other Frameworks

While `fs-browser` includes a Vite plugin, you can use it with any framework or development setup by running the `withfs` server separately.

### React (Create React App, Next.js)

**Option 1: Proxy (Recommended for CRA)**

```javascript
// package.json (Create React App)
{
  "proxy": "http://localhost:5001"
}
```

```bash
# Terminal 1: fs API server
withfs --justfs --port 5001

# Terminal 2: React dev server
npm start
```

```javascript
// App.js
import { readFile, writeFile } from 'fs-browser';

function App() {
  const handleSave = async () => {
    await writeFile('data.txt', 'Hello from React!');
  };
  
  return <button onClick={handleSave}>Save File</button>;
}
```

**Option 2: Configure API Base (Next.js, App Router)**

```javascript
// lib/fs.js
import fs from 'fs-browser';

export default fs.configure({ 
  apiBase: 'http://localhost:5001/api/fs' 
});
```

```javascript
// app/page.js
import fs from '@/lib/fs';

export default function Page() {
  const saveFile = async () => {
    await fs.writeFile('notes.txt', 'Hello Next.js!');
  };
  
  return <button onClick={saveFile}>Save</button>;
}
```

### Vue (Vue CLI, Nuxt)

**Vue CLI with Proxy**

```javascript
// vue.config.js
module.exports = {
  devServer: {
    proxy: {
      '/api/fs': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
};
```

```bash
# Terminal 1: fs API server
withfs --justfs --port 5001

# Terminal 2: Vue dev server
npm run serve
```

```vue
<!-- App.vue -->
<script setup>
import { readFile, writeFile } from 'fs-browser';

const saveFile = async () => {
  await writeFile('vue-data.json', { framework: 'Vue' });
};
</script>

<template>
  <button @click="saveFile">Save File</button>
</template>
```

**Nuxt 3 with Configuration**

```javascript
// composables/useFs.js
import fs from 'fs-browser';

export const useFs = () => {
  return fs.configure({ 
    apiBase: 'http://localhost:5001/api/fs' 
  });
};
```

```vue
<!-- pages/index.vue -->
<script setup>
const fs = useFs();

const saveData = async () => {
  await fs.writeFile('nuxt-file.txt', 'Hello Nuxt!');
};
</script>
```

### Angular

**Proxy Configuration**

```json
// proxy.conf.json
{
  "/api/fs": {
    "target": "http://localhost:5001",
    "secure": false,
    "changeOrigin": true
  }
}
```

```json
// angular.json
{
  "serve": {
    "options": {
      "proxyConfig": "proxy.conf.json"
    }
  }
}
```

```bash
# Terminal 1: fs API server
withfs --justfs --port 5001

# Terminal 2: Angular dev server
ng serve
```

```typescript
// app.component.ts
import { readFile, writeFile } from 'fs-browser';

export class AppComponent {
  async saveFile() {
    await writeFile('angular-data.json', { framework: 'Angular' });
  }
}
```

### Svelte (SvelteKit)

**SvelteKit with Proxy**

```javascript
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';

export default {
  plugins: [sveltekit()],
  server: {
    proxy: {
      '/api/fs': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
};
```

```bash
# Terminal 1: fs API server
withfs --justfs --port 5001

# Terminal 2: SvelteKit dev server
npm run dev
```

```svelte
<!-- +page.svelte -->
<script>
  import { readFile, writeFile } from 'fs-browser';
  
  async function saveFile() {
    await writeFile('svelte-data.txt', 'Hello SvelteKit!');
  }
</script>

<button on:click={saveFile}>Save File</button>
```

### Astro

**With Astro Dev Server**

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  vite: {
    server: {
      proxy: {
        '/api/fs': {
          target: 'http://localhost:5001',
          changeOrigin: true
        }
      }
    }
  }
});
```

```bash
# Terminal 1: fs API server
withfs --justfs --port 5001

# Terminal 2: Astro dev server
npm run dev
```

```astro
---
// src/pages/index.astro
---
<script>
  import { writeFile } from 'fs-browser';
  
  document.querySelector('#save')?.addEventListener('click', async () => {
    await writeFile('astro-data.json', { framework: 'Astro' });
  });
</script>

<button id="save">Save File</button>
```

### Vanilla JavaScript / HTML

**Direct Configuration**

```html
<!DOCTYPE html>
<html>
<head>
  <title>fs-browser Demo</title>
</head>
<body>
  <button id="save">Save File</button>
  <button id="read">Read File</button>
  <pre id="output"></pre>

  <script type="module">
    import fs from 'https://cdn.jsdelivr.net/npm/fs-browser/src/index.js';

    // Configure to point to your fs server
    const myFs = fs.configure({ 
      apiBase: 'http://localhost:5001/api/fs' 
    });

    document.getElementById('save').onclick = async () => {
      await myFs.writeFile('demo.txt', 'Hello from vanilla JS!');
      alert('File saved!');
    };

    document.getElementById('read').onclick = async () => {
      const content = await myFs.readFile('demo.txt');
      document.getElementById('output').textContent = content;
    };
  </script>
</body>
</html>
```

```bash
# Run the fs API server
withfs --justfs --port 5001 --host

# Open the HTML file in browser
# Or use any simple HTTP server:
python -m http.server 8000
```

### Webpack Dev Server

**Proxy Configuration**

```javascript
// webpack.config.js
module.exports = {
  devServer: {
    proxy: {
      '/api/fs': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
};
```

### Parcel

**No configuration needed!** Just run both servers:

```bash
# Terminal 1: fs API server
withfs --justfs --port 5001

# Terminal 2: Parcel dev server
npx parcel index.html
```

```javascript
// Configure in your JS
import { configure } from 'fs-browser';

configure({ apiBase: 'http://localhost:5001/api/fs' });
```

### Production Deployment

For production, you have several options:

**Option 1: Same Server**
```bash
# Build your frontend
npm run build

# Serve everything together
withfs ./dist --host
```

**Option 2: Separate Services**
```bash
# Frontend on CDN/static host
# Backend fs API on separate server
withfs --justfs --host --port 5001

# Configure frontend to point to API
fs.configure({ apiBase: 'https://fs-api.example.com/api/fs' });
```

**Option 3: Reverse Proxy (Nginx)**
```nginx
location /api/fs {
    proxy_pass http://localhost:5001/api/fs;
}

location / {
    root /var/www/html;
}
```

### Environment Variables

Set API base via environment variables:

```javascript
// config/fs.js
import fs from 'fs-browser';

const API_BASE = import.meta.env.VITE_FS_API_BASE || 
                 process.env.REACT_APP_FS_API_BASE ||
                 '/api/fs';

export default fs.configure({ apiBase: API_BASE });
```

```bash
# .env
VITE_FS_API_BASE=http://localhost:5001/api/fs
# or
REACT_APP_FS_API_BASE=http://localhost:5001/api/fs
```

### Docker Setup

```dockerfile
# Dockerfile
FROM node:18

WORKDIR /app

# Install fs-browser globally
RUN npm install -g fs-browser

# Copy your built frontend
COPY ./dist ./dist

# Expose port
EXPOSE 3000

# Run withfs
CMD ["withfs", "./dist", "--host", "0.0.0.0", "--port", "3000"]
```

```yaml
# docker-compose.yml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
```

### Summary

- **Development**: Run `withfs --justfs` on a separate port and use proxy or configure API base
- **Production**: Use `withfs ./dist --host` to serve everything together
- **Microservices**: Run `withfs --justfs` as a dedicated fs API service
- **Any Framework**: Works with any setup that can make HTTP requests!


## API Reference

### File Reading

- `readFile(path, options?)` - Read file contents
- `readdir(path, options?)` - List directory contents
- `stat(path)` - Get file/directory stats
- `lstat(path)` - Get stats without following symlinks
- `realpath(path)` - Get canonical path
- `readlink(path)` - Read symbolic link
- `exists(path)` - Check if file exists

### File Writing

- `writeFile(path, data, options?)` - Write data to file
- `appendFile(path, data, options?)` - Append data to file
- `copyFile(src, dest, flags?)` - Copy file

### Directory Operations

- `mkdir(path, options?)` - Create directory
- `rmdir(path, options?)` - Remove directory
- `rm(path, options?)` - Remove file or directory

### File Manipulation

- `rename(oldPath, newPath)` - Rename or move file/directory
- `unlink(path)` - Delete file

## TypeScript Support

Full TypeScript definitions included:

```typescript
import { readFile, writeFile, Stats, Dirent } from 'fs-browser';

const content: string = await readFile('test.txt', 'utf8');
const stats: Stats = await stat('test.txt');
const files: Dirent[] = await readdir('.', { withFileTypes: true });
```

## Plugin Options

```typescript
interface PluginOptions {
  baseDir?: string;    // Base directory for file operations (default: './data')
  apiPrefix?: string;  // API route prefix (default: '/api/fs')
}
```

## Data Types Supported

- **Text**: Plain text strings
- **JSON**: JavaScript objects (auto-serialized)
- **Binary**: Buffers, ArrayBuffers, TypedArrays
- **Blob**: Browser Blob objects

## Security

All file operations are restricted to the configured base directory. Attempts to access files outside this directory will throw an error.

## License

MIT © claude:sonnet4.5

## Contributing

Contributions welcome! Please open an issue or PR.