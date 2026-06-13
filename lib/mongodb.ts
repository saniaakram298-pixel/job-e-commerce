import { MongoClient, MongoClientOptions } from 'mongodb';
import process from 'process';
import { global } from 'styled-jsx/css';

const uri = process.env.MONGODB_URI as string;
const options: MongoClientOptions = {
    allowPartialTrustChain: undefined,
    ALPNProtocols: undefined,
    ca: undefined,
    cert: undefined,
    checkServerIdentity: undefined,
    ciphers: undefined,
    crl: undefined,
    ecdhCurve: undefined,
    key: undefined,
    minDHSize: undefined,
    passphrase: undefined,
    pfx: undefined,
    rejectUnauthorized: undefined,
    secureContext: undefined,
    secureProtocol: undefined,
    servername: undefined,
    session: undefined,
    autoSelectFamily: undefined,
    autoSelectFamilyAttemptTimeout: undefined,
    keepAliveInitialDelay: undefined,
    family: undefined,
    hints: undefined,
    localAddress: undefined,
    localPort: undefined,
    lookup: undefined
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
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // Production mein seedha connect
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;