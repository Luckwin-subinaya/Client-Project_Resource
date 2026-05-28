const { getDb } = require("../db");

const collectionName = "resources";

async function initializeResourceCollection() {
  const db = getDb();
  const collectionExists = await db
    .listCollections({ name: collectionName })
    .hasNext();

  const validator = {
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
        "project_ids",
      ],
      properties: {
        _id: { bsonType: "int" },
        name: { bsonType: "string" },
        tech_stack: { bsonType: "array", items: { bsonType: "string" } },
        department: { bsonType: "string" },
        designation: { bsonType: "string" },
        salary: { bsonType: "int" },
        project_names: { bsonType: "array", items: { bsonType: "string" } },
        project_ids: { bsonType: "array", items: { bsonType: "int" } },
      },
    },
  };

  try {
    if (!collectionExists) {
      await db.createCollection(collectionName, { validator });
      console.log("Resource collection created");
    } else {
      await db.command({ collMod: collectionName, validator });
      console.log("Resource collection schema updated");
    }

    await db.collection(collectionName).createIndex({ project_names: 1 });

    await db.collection(collectionName).updateMany(
      { project_ids: { $exists: false } },
      { $set: { project_ids: [] } }
    );
  } catch (err) {
    if (err.codeName === "NamespaceNotFound" || err.message.includes("Collection already exists")) {
      return;
    }
    console.error("Error initializing resource collection:", err.message);
    throw err;
  }
}

module.exports = { collectionName, initializeResourceCollection };