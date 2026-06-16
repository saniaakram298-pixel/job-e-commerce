// Simple script to verify MongoDB connection using the native driver
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not found in environment. Create a .env.local with MONGODB_URI.');
  process.exit(2);
}

(async () => {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    family: 4,
  });
  try {
    await client.connect();
    await client.db().admin().ping();
    console.log('Connected successfully to MongoDB Atlas.');
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('MongoDB connection failed:');
    console.error(err && err.message ? err.message : err);
    console.error('\nCommon fixes:');
    console.error('- Ensure MONGODB_URI is correct in .env.local');
    console.error('- Add your IP to Atlas Network Access (or allow 0.0.0.0/0 for dev)');
    console.error('- If URI uses mongodb+srv, ensure DNS resolves on this machine');
    process.exit(1);
  }
})();
