import mongoose from 'mongoose';

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

// Use a stable global cache so hot-reloading / lambda warm-ups reuse connections
const globalAny: any = global;
const cached: Cached = globalAny._mongoose || (globalAny._mongoose = { conn: null, promise: null });

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
    // Tune mongoose to fail fast for server components
    mongoose.set('strictQuery', false);

    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 60000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((m) => m)
      .catch((error) => {
        cached.promise = null;
        console.error('MongoDB connection error:', error?.message ?? error);
        return null;
      });
  }

  try {
    const conn = await cached.promise;
    cached.conn = conn;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.error('MongoDB connection error:', (e as Error).message ?? e);
  }

  return cached.conn;
}
