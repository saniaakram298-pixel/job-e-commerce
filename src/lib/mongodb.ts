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
    message.includes('server selection timed out') ||
    error?.name === 'MongoNetworkError' ||
    error?.name === 'MongoNetworkTimeoutError' ||
    error?.name === 'MongoServerSelectionError'
  );
}

export async function connectDB(): Promise<typeof mongoose | null> {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

  if (!mongoUri) {
    console.warn('MongoDB connection string is not configured. Set MONGODB_URI or MONGO_URI.');
    return cached.conn || null;
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (cached.promise) {
    return cached.promise;
  }

  mongoose.set('strictQuery', false);

  const retries = Number.parseInt(process.env.MONGODB_CONNECT_RETRIES || process.env.MONGO_CONNECT_RETRIES || '3', 10);
  const baseDelayMs = 1000;
  const timeoutMs = Number.parseInt(process.env.MONGODB_TIMEOUT_MS || process.env.MONGO_TIMEOUT_MS || '0', 10);
  const effectiveTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 0;

  const options: ConnectOptions = {
    bufferCommands: false,
    serverSelectionTimeoutMS: effectiveTimeoutMs,
    connectTimeoutMS: effectiveTimeoutMs,
    socketTimeoutMS: effectiveTimeoutMs,
    maxPoolSize: 5,
    minPoolSize: 0,
    family: 4,
    autoCreate: true,
    autoIndex: true,
    retryWrites: true,
    retryReads: true,
  } as ConnectOptions;

  cached.promise = (async () => {
    for (let attempt = 0; attempt < retries; attempt += 1) {
      try {
        console.log(`MongoDB connection attempt ${attempt + 1}...`);
        const conn = await mongoose.connect(mongoUri, options);
        cached.conn = conn;
        return conn;
      } catch (error: any) {
        const isTransient = isTransientError(error);
        if (attempt < retries - 1 && isTransient) {
          const delay = Math.min(10000, baseDelayMs * 2 ** attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          console.error('Final MongoDB connection attempt failed:', error?.message || error);
          return null;
        }
      }
    }

    return null;
  })();

  try {
    const connectionResult = await cached.promise;
    if (!connectionResult) {
      cached.promise = null;
      cached.conn = null;
    }
    return connectionResult;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    return null;
  }
}