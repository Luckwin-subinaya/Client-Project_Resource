const { getDb } = require("../db");

const collectionName = "clients";

async function initializeClientCollection() {
  const db = getDb();
  try {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["_id", "name", "location", "type", "status", "created_at"],
          properties: {
            _id: { bsonType: "int" },
            name: { bsonType: "string" },
            location: { bsonType: "string" },
            type: { bsonType: "string" },
            status: { enum: ["active", "inactive"] },
            created_at: { bsonType: "date" },
          },
        },
      },
    });
    await db.collection(collectionName).createIndex({ name: 1 }, { unique: true });
    console.log("Client collection initialized");
  } catch (err) {
    // Ignore if collection already exists
    if (!err.message.includes("Collection already exists")) {
      throw err;
    }
  }
}

module.exports = { collectionName, initializeClientCollection };