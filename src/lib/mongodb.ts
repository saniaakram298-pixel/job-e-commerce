import mongoose, { ConnectOptions } from 'mongoose';

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

// Use a stable global cache so hot-reloading / lambda warm-ups reuse connections
const globalAny: any = global;
const cached: Cached = globalAny._mongoose || (globalAny._mongoose = { conn: null, promise: null });

/**
 * Check if an error is a transient connection error (retry-worthy)
 */
function isTransientError(error: any): boolean {
  const message = (error?.message || '').toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('ehostunreach') ||
    message.includes('enetunreach') ||
    error.name === 'MongoNetworkError' ||
    error.name === 'MongoNetworkTimeoutError' ||
    error.name === 'MongoServerSelectionError'
  );
}

export async function connectDB(): Promise<typeof mongoose | null> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not configured, running in offline mode');
    return cached.conn || null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', false);

    const retries = parseInt(process.env.MONGODB_CONNECT_RETRIES || '3', 10);
    const baseDelayMs = 1000; // initial backoff in milliseconds

    cached.promise = (async () => {
      // Production-ready connection options
      const options: ConnectOptions = {
        bufferCommands: true,
        bufferTimeoutMS: 30000,  // Wait 30s for connection before buffering timeout
        // Timeouts tailored for production serverless
        serverSelectionTimeoutMS: 30000,  // Wait max 30s to find a server
        connectTimeoutMS: 30000,          // Wait max 30s to connect
        socketTimeoutMS: 60000,           // Wait max 60s for socket operations
        // Connection pool sizing for concurrent workloads
        maxPoolSize: 10,                  // Max 10 connections in pool
        minPoolSize: 2,                   // Min 2 connections to keep warm
        // IPv4 preference for better reliability
        family: 4,
        // Automatically create collections and indexes
        autoCreate: true,
        autoIndex: true,
        // Retry writes on transient failures
        retryWrites: true,
        retryReads: true,
      } as any;

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          console.log(`[MongoDB] Connection attempt ${attempt + 1}/${retries}`);
          const conn = await mongoose.connect(MONGODB_URI, options);
          console.log('[MongoDB] Connected successfully');
          return conn;
        } catch (error: any) {
          const isTransient = isTransientError(error);
          const errorType = isTransient ? 'transient' : 'permanent';
          console.error(
            `[MongoDB] Connection attempt ${attempt + 1} failed (${errorType}):`,
            error?.message ?? String(error)
          );

          if (attempt < retries - 1 && isTransient) {
            // Exponential backoff only for transient errors
            const delay = Math.min(30000, baseDelayMs * Math.pow(2, attempt));
            console.log(`[MongoDB] Retrying in ${delay}ms...`);
            await new Promise((res) => setTimeout(res, delay));
          } else if (attempt === retries - 1) {
            // Last attempt failed
            throw error;
          } else if (!isTransient) {
            // Permanent error, don't retry
            throw error;
          }
        }
      }

      return null;
    })().catch((error) => {
      cached.promise = null;
      console.error('[MongoDB] Connection failed:', (error as Error)?.message ?? error);
      throw error;
    });
  }

  try {
    const conn = await cached.promise;
    if (!conn) {
      throw new Error('MongoDB connection failed: connection was not established');
    }
    cached.conn = conn;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.error('[MongoDB] Connection error during await:', (e as Error).message ?? e);
    throw e;
  }

  return cached.conn;
}

/**
 * Utility to apply query timeout to Mongoose operations
 * Ensures long-running queries don't block requests
 */
export async function withQueryTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 20000
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Query timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}
