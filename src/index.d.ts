/**
 * fs:browser - Browser-compatible filesystem API
 * TypeScript Declaration File
 */

declare module 'fs:browser' {
  /**
   * Configuration options for fs-browser
   */
  export interface FsConfig {
    apiBase?: string;
  }

  /**
   * File encoding options
   */
  export type BufferEncoding =
    | 'ascii'
    | 'utf8'
    | 'utf-8'
    | 'utf16le'
    | 'ucs2'
    | 'ucs-2'
    | 'base64'
    | 'base64url'
    | 'latin1'
    | 'binary'
    | 'hex';

  /**
   * Options for file operations
   */
  export interface FileOptions {
    encoding?: BufferEncoding | null;
    flag?: string;
    mode?: number;
  }

  /**
   * Options for directory operations
   */
  export interface MkdirOptions {
    recursive?: boolean;
    mode?: number;
  }

  /**
   * Options for readdir
   */
  export interface ReaddirOptions {
    encoding?: BufferEncoding | null;
    withFileTypes?: boolean;
  }

  /**
   * Options for rm/rmdir operations
   */
  export interface RmOptions {
    recursive?: boolean;
    force?: boolean;
    maxRetries?: number;
    retryDelay?: number;
  }

  /**
   * Directory entry with type information
   */
  export interface Dirent {
    name: string;
    isFile(): boolean;
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
  }

  /**
   * File statistics
   */
  export interface Stats {
    isFile(): boolean;
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
    mode: number;
    size: number;
    atimeMs: number;
    mtimeMs: number;
    ctimeMs: number;
    birthtimeMs: number;
    atime: Date;
    mtime: Date;
    ctime: Date;
    birthtime: Date;
  }

  /**
   * Read file contents
   * @param path - File path
   * @param options - Encoding string or options object
   * @returns File contents as string or Buffer
   */
  export function readFile(
    path: string,
    options?: BufferEncoding | FileOptions
  ): Promise<string>;

  /**
   * Write data to file
   * @param path - File path
   * @param data - Data to write (string, Buffer, Blob, ArrayBuffer, TypedArray, or object)
   * @param options - Encoding string or options object
   */
  export function writeFile(
    path: string,
    data: string | Buffer | Blob | ArrayBuffer | ArrayBufferView | object,
    options?: BufferEncoding | FileOptions
  ): Promise<void>;

  /**
   * Append data to file
   * @param path - File path
   * @param data - Data to append (string, Buffer, Blob, ArrayBuffer, TypedArray, or object)
   * @param options - Encoding string or options object
   */
  export function appendFile(
    path: string,
    data: string | Buffer | Blob | ArrayBuffer | ArrayBufferView | object,
    options?: BufferEncoding | FileOptions
  ): Promise<void>;

  /**
   * Copy file
   * @param src - Source path
   * @param dest - Destination path
   * @param flags - Copy flags (default: 0)
   */
  export function copyFile(
    src: string,
    dest: string,
    flags?: number
  ): Promise<void>;

  /**
   * Read directory contents
   * @param path - Directory path
   * @param options - Options object
   * @returns Array of filenames or Dirent objects
   */
  export function readdir(
    path: string,
    options?: { withFileTypes?: false } & ReaddirOptions
  ): Promise<string[]>;
  export function readdir(
    path: string,
    options: { withFileTypes: true } & ReaddirOptions
  ): Promise<Dirent[]>;
  export function readdir(
    path: string,
    options?: ReaddirOptions
  ): Promise<string[] | Dirent[]>;

  /**
   * Create directory
   * @param path - Directory path
   * @param options - Options object
   */
  export function mkdir(
    path: string,
    options?: MkdirOptions
  ): Promise<void>;

  /**
   * Remove directory
   * @param path - Directory path
   * @param options - Options object
   */
  export function rmdir(
    path: string,
    options?: RmOptions
  ): Promise<void>;

  /**
   * Remove file or directory
   * @param path - Path to remove
   * @param options - Options object
   */
  export function rm(
    path: string,
    options?: RmOptions
  ): Promise<void>;

  /**
   * Rename or move file/directory
   * @param oldPath - Old path
   * @param newPath - New path
   */
  export function rename(
    oldPath: string,
    newPath: string
  ): Promise<void>;

  /**
   * Delete file
   * @param path - File path
   */
  export function unlink(path: string): Promise<void>;

  /**
   * Get file/directory stats
   * @param path - Path
   * @returns File statistics
   */
  export function stat(path: string): Promise<Stats>;

  /**
   * Get file/directory stats (doesn't follow symlinks)
   * @param path - Path
   * @returns File statistics
   */
  export function lstat(path: string): Promise<Stats>;

  /**
   * Get canonical path
   * @param path - Path
   * @returns Resolved path
   */
  export function realpath(path: string): Promise<string>;

  /**
   * Read symbolic link
   * @param path - Link path
   * @returns Link target path
   */
  export function readlink(path: string): Promise<string>;

  /**
   * Check if file exists (convenience method)
   * @param path - Path
   * @returns true if exists, false otherwise
   */
  export function exists(path: string): Promise<boolean>;

  /**
   * Configure the fs-browser module
   * @param options - Configuration options
   * @returns Configured fs module with all methods
   */
  export function configure(options: FsConfig): {
    readFile: typeof readFile;
    writeFile: typeof writeFile;
    appendFile: typeof appendFile;
    copyFile: typeof copyFile;
    readdir: typeof readdir;
    mkdir: typeof mkdir;
    rmdir: typeof rmdir;
    rm: typeof rm;
    rename: typeof rename;
    unlink: typeof unlink;
    stat: typeof stat;
    lstat: typeof lstat;
    realpath: typeof realpath;
    readlink: typeof readlink;
    exists: typeof exists;
    configure: typeof configure;
  };

  /**
   * Default export with all methods
   */
  const fs: {
    readFile: typeof readFile;
    writeFile: typeof writeFile;
    appendFile: typeof appendFile;
    copyFile: typeof copyFile;
    readdir: typeof readdir;
    mkdir: typeof mkdir;
    rmdir: typeof rmdir;
    rm: typeof rm;
    rename: typeof rename;
    unlink: typeof unlink;
    stat: typeof stat;
    lstat: typeof lstat;
    realpath: typeof realpath;
    readlink: typeof readlink;
    exists: typeof exists;
    configure: typeof configure;
  };

  export default fs;
}