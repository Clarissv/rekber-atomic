const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_DB;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let database;

async function connectToDatabase() {
  try {
    await client.connect();
    database = client.db('MiddlemanBot');
    console.log('✅ Successfully connected to MongoDB!');
    return database;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

function getDatabase() {
  if (!database) {
    throw new Error('Database not initialized. Call connectToDatabase first.');
  }
  return database;
}

async function closeConnection() {
  await client.close();
  console.log('MongoDB connection closed.');
}

module.exports = {
  connectToDatabase,
  getDatabase,
  closeConnection
};
