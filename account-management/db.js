const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

let db = null;

async function connectToMongo() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db();
    return db;
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    throw err;
  }
}

function getDb() {
  if (!db) {
    throw new Error("Database not connected. Call connectToMongo first.");
  }
  return db;
}

module.exports = { connectToMongo, getDb };