import { MongoClient, MongoClientOptions } from 'mongodb';
import process from 'process';
import { global } from 'styled-jsx/css';

const uri = process.env.MONGODB_URI as string;
const options: MongoClientOptions = {
    serverSelectionTimeoutMS: 30000, // Increased from 5000 to 30 seconds
    connectTimeoutMS: 20000, // Increased from 10000 to 20 seconds
    socketTimeoutMS: 45000, // Added socket timeout
    maxPoolSize: 10,
    minPoolSize: 2,
    retryWrites: true,
    retryReads: true,
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