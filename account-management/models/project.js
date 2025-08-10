const { getDb } = require("../db");

const collectionName = "projects";

async function initializeProjectCollection() {
  const db = getDb();
  try {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["_id", "client_id", "project_name", "estimated_billing", "required_resources", "created_at"],
          properties: {
            _id: { bsonType: "int" },
            client_id: { bsonType: "int" },
            project_name: { bsonType: "string" },
            estimated_billing: { bsonType: "int" },
            required_resources: { bsonType: "array", items: { bsonType: "string" } },
            created_at: { bsonType: "date" },
          },
        },
      },
    });
    await db.collection(collectionName).createIndex({ client_id: 1 });
    console.log("Project collection initialized");
  } catch (err) {
    if (!err.message.includes("Collection already exists")) {
      throw err;
    }
  }
}

module.exports = { collectionName, initializeProjectCollection };