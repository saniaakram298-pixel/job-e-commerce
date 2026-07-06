import mongoose, { ConnectOptions } from 'mongoose';

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

const globalAny: any = global;
const cached: Cached = globalAny._mongoose || (globalAny._mongoose = { conn: null, promise: null });

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

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return cached.conn;
  }

  if (mongoose.connection.readyState === 2 && cached.promise) {
    return cached.promise;
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', false);

    const retries = parseInt(process.env.MONGODB_CONNECT_RETRIES || '3', 10);
    const baseDelayMs = 1000;

    cached.promise = (async () => {
      const options: ConnectOptions = {
        bufferCommands: true,
        bufferTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        maxPoolSize: 10,
        minPoolSize: 2,
        family: 4,
        autoCreate: true,
        autoIndex: true,
        retryWrites: true,
        retryReads: true,
      } as any;

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const conn = await mongoose.connect(MONGODB_URI, options);
          return conn;
        } catch (error: any) {
          const isTransient = isTransientError(error);
          if (attempt < retries - 1 && isTransient) {
            const delay = Math.min(30000, baseDelayMs * Math.pow(2, attempt));
            await new Promise((res) => setTimeout(res, delay));
          } else {
            throw error;
          }
        }
      }

      return null;
    })().catch((error) => {
      cached.promise = null;
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
    throw e;
  }

  return cached.conn;
}