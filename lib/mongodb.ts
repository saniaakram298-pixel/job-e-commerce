import { MongoClient, MongoClientOptions } from 'mongodb';
import process from 'process';
import { global } from 'styled-jsx/css';

const uri = process.env.MONGODB_URI as string;
const options: MongoClientOptions = {
    // Fail fast if Atlas is unreachable
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    // Prefer IPv4 in some environments
    family: 4,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
    throw new Error('Please add your Mongo URI to .env.local');
}

// Global type definition to prevent errors in development
const globalWithMongo = global as unknown as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
};

if (process.env.NODE_ENV === 'development') {
    // Development mein connection cache karte hain
    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect().catch((err) => {
            console.error('MongoClient connect error (dev):', err.message || err);
            throw new Error((err && err.message) || String(err) + "\nCheck MONGODB_URI and Atlas IP whitelist.");
        });
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // Production mein seedha connect
    client = new MongoClient(uri, options);
    clientPromise = client.connect().catch((err) => {
        console.error('MongoClient connect error (prod):', err.message || err);
        throw new Error((err && err.message) || String(err) + "\nCheck MONGODB_URI and Atlas IP whitelist.");
    });
}

export default clientPromise;