/**
 * fs:browser - Browser-compatible filesystem API
 * Uses fetch to communicate with backend fs API
 */

let API_BASE = '/api/fs';

/**
 * Configure the fs-browser module
 * @param {Object} options - Configuration options
 * @param {string} options.apiBase - Base URL for the fs API
 * @returns {Object} - Configured fs module
 */
export function configure(options = {}) {
  if (options.apiBase !== undefined) {
    API_BASE = options.apiBase;
    // Ensure no trailing slash
    if (API_BASE.endsWith('/')) {
      API_BASE = API_BASE.slice(0, -1);
    }
  }
  
  return {
    readFile,
    writeFile,
    appendFile,
    copyFile,
    readdir,
    mkdir,
    rmdir,
    rm,
    rename,
    unlink,
    stat,
    lstat,
    realpath,
    readlink,
    exists,
    configure
  };
}

/**
 * Read file contents
 * @param {string} path - File path
 * @param {string|Object} options - Encoding string or options object
 * @returns {Promise<string|Buffer>}
 */
export async function readFile(path, options = 'utf8') {
  const encoding = typeof options === 'string' ? options : options?.encoding || 'utf8';
  const response = await fetch(`${API_BASE}/readFile?path=${encodeURIComponent(path)}&encoding=${encoding}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to read file');
  }
  
  const { data } = await response.json();
  return data;
}

/**
 * Write data to file
 * @param {string} path - File path
 * @param {string|Buffer|Blob} data - Data to write
 * @param {string|Object} options - Encoding string or options object
 * @returns {Promise<void>}
 */
export async function writeFile(path, data, options = 'utf8') {
  const encoding = typeof options === 'string' ? options : options?.encoding || 'utf8';
  
  let body;
  let contentType;
  
  // Handle Blob
  if (data instanceof Blob) {
    body = data;
    contentType = data.type || 'application/octet-stream';
  }
  // Handle ArrayBuffer
  else if (data instanceof ArrayBuffer) {
    body = new Blob([data], { type: 'application/octet-stream' });
    contentType = 'application/octet-stream';
  }
  // Handle Uint8Array or other TypedArray
  else if (ArrayBuffer.isView(data)) {
    body = new Blob([data], { type: 'application/octet-stream' });
    contentType = 'application/octet-stream';
  }
  // Handle string
  else if (typeof data === 'string') {
    body = new Blob([data], { type: 'text/plain' });
    contentType = 'text/plain';
  }
  // Handle object (convert to JSON)
  else if (typeof data === 'object') {
    body = JSON.stringify(data);
    contentType = 'application/json';
  }
  else {
    throw new Error('Unsupported data type');
  }
  
  const response = await fetch(`${API_BASE}/writeFile?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to write file');
  }
}

/**
 * Append data to file
 * @param {string} path - File path
 * @param {string|Buffer|Blob} data - Data to append
 * @param {string|Object} options - Encoding string or options object
 * @returns {Promise<void>}
 */
export async function appendFile(path, data, options = 'utf8') {
  const encoding = typeof options === 'string' ? options : options?.encoding || 'utf8';
  
  let body;
  let contentType;
  
  if (data instanceof Blob) {
    body = data;
    contentType = data.type || 'application/octet-stream';
  }
  else if (data instanceof ArrayBuffer) {
    body = new Blob([data], { type: 'application/octet-stream' });
    contentType = 'application/octet-stream';
  }
  else if (ArrayBuffer.isView(data)) {
    body = new Blob([data], { type: 'application/octet-stream' });
    contentType = 'application/octet-stream';
  }
  else if (typeof data === 'string') {
    body = new Blob([data], { type: 'text/plain' });
    contentType = 'text/plain';
  }
  else if (typeof data === 'object') {
    body = JSON.stringify(data);
    contentType = 'application/json';
  }
  else {
    throw new Error('Unsupported data type');
  }
  
  const response = await fetch(`${API_BASE}/appendFile?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to append file');
  }
}

/**
 * Copy file
 * @param {string} src - Source path
 * @param {string} dest - Destination path
 * @param {number} flags - Copy flags
 * @returns {Promise<void>}
 */
export async function copyFile(src, dest, flags = 0) {
  const response = await fetch(`${API_BASE}/copyFile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ src, dest, flags })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to copy file');
  }
}

/**
 * Read directory contents
 * @param {string} path - Directory path
 * @param {Object} options - Options
 * @returns {Promise<string[]|Dirent[]>}
 */
export async function readdir(path, options = {}) {
  const withFileTypes = options.withFileTypes || false;
  const response = await fetch(`${API_BASE}/readdir?path=${encodeURIComponent(path)}&withFileTypes=${withFileTypes}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to read directory');
  }
  
  const { files } = await response.json();
  return files;
}

/**
 * Create directory
 * @param {string} path - Directory path
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
export async function mkdir(path, options = {}) {
  const recursive = options.recursive !== undefined ? options.recursive : true;
  const response = await fetch(`${API_BASE}/mkdir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, recursive })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create directory');
  }
}

/**
 * Remove directory
 * @param {string} path - Directory path
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
export async function rmdir(path, options = {}) {
  const recursive = options.recursive || false;
  const response = await fetch(`${API_BASE}/rmdir`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, recursive })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to remove directory');
  }
}

/**
 * Remove file or directory
 * @param {string} path - Path to remove
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
export async function rm(path, options = {}) {
  const recursive = options.recursive || false;
  const force = options.force || false;
  const response = await fetch(`${API_BASE}/rm`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, recursive, force })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to remove');
  }
}

/**
 * Rename or move file/directory
 * @param {string} oldPath - Old path
 * @param {string} newPath - New path
 * @returns {Promise<void>}
 */
export async function rename(oldPath, newPath) {
  const response = await fetch(`${API_BASE}/rename`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPath, newPath })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to rename');
  }
}

/**
 * Delete file
 * @param {string} path - File path
 * @returns {Promise<void>}
 */
export async function unlink(path) {
  const response = await fetch(`${API_BASE}/unlink`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete file');
  }
}

/**
 * Get file/directory stats
 * @param {string} path - Path
 * @returns {Promise<Stats>}
 */
export async function stat(path) {
  const response = await fetch(`${API_BASE}/stat?path=${encodeURIComponent(path)}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get stats');
  }
  
  const { stats } = await response.json();
  return stats;
}

/**
 * Get file/directory stats (doesn't follow symlinks)
 * @param {string} path - Path
 * @returns {Promise<Stats>}
 */
export async function lstat(path) {
  const response = await fetch(`${API_BASE}/lstat?path=${encodeURIComponent(path)}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get stats');
  }
  
  const { stats } = await response.json();
  return stats;
}

/**
 * Get canonical path
 * @param {string} path - Path
 * @returns {Promise<string>}
 */
export async function realpath(path) {
  const response = await fetch(`${API_BASE}/realpath?path=${encodeURIComponent(path)}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get real path');
  }
  
  const { realPath } = await response.json();
  return realPath;
}

/**
 * Read symbolic link
 * @param {string} path - Link path
 * @returns {Promise<string>}
 */
export async function readlink(path) {
  const response = await fetch(`${API_BASE}/readlink?path=${encodeURIComponent(path)}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to read link');
  }
  
  const { target } = await response.json();
  return target;
}

/**
 * Check if file exists (convenience method)
 * @param {string} path - Path
 * @returns {Promise<boolean>}
 */
export async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

// Default export with all methods
export default {
  readFile,
  writeFile,
  appendFile,
  copyFile,
  readdir,
  mkdir,
  rmdir,
  rm,
  rename,
  unlink,
  stat,
  lstat,
  realpath,
  readlink,
  exists,
  configure
};