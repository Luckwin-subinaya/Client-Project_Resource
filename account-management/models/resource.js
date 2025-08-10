const { getDb } = require("../db");

const collectionName = "resources";

async function initializeResourceCollection() {
  const db = getDb();
  try {
    await db.command({
      collMod: collectionName,
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "_id",
            "name",
            "tech_stack",
            "department",
            "designation",
            "salary",
            "project_names",
            "project_ids", // <-- add this
          ],
          properties: {
            _id: { bsonType: "int" },
            name: { bsonType: "string" },
            tech_stack: { bsonType: "array", items: { bsonType: "string" } },
            department: { bsonType: "string" },
            designation: { bsonType: "string" },
            salary: { bsonType: "int" },
            project_names: { bsonType: "array", items: { bsonType: "string" } },
            project_ids: { bsonType: "array", items: { bsonType: "int" } }, // <-- add this
          },
        },
      },
    });

    await db.collection(collectionName).createIndex({ project_names: 1 });

    // Update existing documents to add project_ids if missing
    await db.collection(collectionName).updateMany(
      { project_ids: { $exists: false } },
      { $set: { project_ids: [] } }
    );

    console.log("Resource collection schema updated");
  } catch (err) {
    if (!err.message.includes("Collection already exists")) {
      console.error("Error updating resource collection:", err.message);
      throw err;
    }
  }
}

module.exports = { collectionName, initializeResourceCollection };