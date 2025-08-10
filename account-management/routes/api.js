const express = require("express");
const router = express.Router();
const { getDb } = require("../db");
const { collectionName: clientCollection } = require("../models/client");
const { collectionName: projectCollection } = require("../models/project");
const { collectionName: resourceCollection } = require("../models/resource");


router.post("/clients", async (req, res) => {
  const db = getDb();
  const { name, location, type } = req.body;

  try {
    // Validate input
    const duplicateClient = await db.collection(clientCollection).findOne({ name: name.toLowerCase() });
    const lastClient = await db
      .collection(clientCollection)
      .find()
      .sort({ _id: -1 })
      .limit(1)
      .toArray();
    const newId = lastClient.length > 0 ? lastClient[0]._id + 1 : 1;


    const client = {
      _id: newId,
      name: name.toLowerCase(),
      location,
      type,
      status: "active",
      created_at: new Date(),
    };

    await db.collection(clientCollection).insertOne(client);
    res.status(201).json({ message: "Client added", client });
  } catch (err) {
    res.status(400).json({ error: err.message });

  }
});


router.patch("/clients/:id/status", async (req, res) => {
  const db = getDb();
  const clientId = parseInt(req.params.id);
  const { status } = req.body;

  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const result = await db.collection(clientCollection).updateOne(
      { _id: clientId },
      { $set: { status } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.json({ message: `Client status updated to ${status}` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Add a Project Under a Client
router.post("/projects", async (req, res) => {
  const db = getDb();
  const { client_id, project_name, estimated_billing, required_resources } = req.body;

  try {
    const client = await db.collection(clientCollection).findOne({ _id: client_id });
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const lastProject = await db
      .collection(projectCollection)
      .find()
      .sort({ _id: -1 })
      .limit(1)
      .toArray();
    const newId = lastProject.length > 0 ? lastProject[0]._id + 1 : 101;

    const project = {
      _id: newId,
      client_id,
      project_name,
      estimated_billing,
      required_resources,
      created_at: new Date(),
    };

    await db.collection(projectCollection).insertOne(project);
    res.status(201).json({ message: "Project added", project });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Helper to get matched project names for a resource
async function getMatchedProjectNames(tech_stack, db) {
  if (!Array.isArray(tech_stack)) return [];
  const projects = await db.collection(projectCollection).find().toArray();
  return projects
    .filter(p =>
      Array.isArray(p.required_resources) &&
      p.required_resources.some(req =>
        tech_stack.map(ts => ts.toLowerCase()).includes(req.toLowerCase())
      )
    )
    .map(p => p.project_name);
}

// Add Resource
router.post("/resources", async (req, res) => {
  const db = getDb();
  const { name, tech_stack, department, designation, salary, status } = req.body;

  try {
    const lastResource = await db
      .collection(resourceCollection)
      .find()
      .sort({ _id: -1 })
      .limit(1)
      .toArray();
    const newId = lastResource.length > 0 ? lastResource[0]._id + 1 : 1001;

    const project_names = await getMatchedProjectNames(tech_stack, db);

    const resource = {
      _id: newId,
      name,
      tech_stack,
      department,
      designation,
      salary,
      status,
      project_names,
      project_ids: [], // <-- add this
    };

    await db.collection(resourceCollection).insertOne(resource);
    res.status(201).json({ message: "Resource added", resource });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Edit Resource
router.patch("/resources/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    const { name, tech_stack, department, designation, salary, status } = req.body;

    // Always compute project_names here
    const project_names = await getMatchedProjectNames(tech_stack, db);

    const update = {
      name,
      tech_stack,
      department,
      designation,
      salary,
      status,
      project_names,
    };

    await db.collection(resourceCollection).updateOne({ _id: id }, { $set: update });
    const resource = await db.collection(resourceCollection).findOne({ _id: id });
    res.json({ resource });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4, 5, & 6. Map Resources to a Project (Tech Stack + Salary/Billing)
router.post("/projects/:id/map-resources", async (req, res) => {
  const db = getDb();
  const projectId = parseInt(req.params.id);

  try {
    const project = await db.collection(projectCollection).findOne({ _id: projectId });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const requiredTech = project.required_resources;
    const billing = project.estimated_billing;
    const maxSalaryBudget = billing * 0.5;

    const matchingResources = await db
      .collection(resourceCollection)
      .find({
        tech_stack: { $in: requiredTech },
        project_ids: { $ne: projectId },
      })
      .sort({ salary: 1 })
      .toArray();

    let totalSalary = 0;
    const selectedResources = [];

    for (let resource of matchingResources) {
      if (totalSalary + resource.salary <= maxSalaryBudget) {
        selectedResources.push(resource._id);
        totalSalary += resource.salary;

        await db.collection(resourceCollection).updateOne(
          { _id: resource._id },
          { $addToSet: { project_ids: projectId } }
        );
      } else {
        break;
      }
    }

    // Update the project with assigned resource IDs
    await db.collection(projectCollection).updateOne(
      { _id: projectId },
      { $set: { resource_ids: selectedResources } }
    );

    res.json({
      message: `Mapped ${selectedResources.length} resources to project ${projectId}`,
      totalSalary,
      selectedResources,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get All Details (Client → Projects → Resources)
router.get("/clients/:id/details", async (req, res) => {
  const db = getDb();
  const clientId = parseInt(req.params.id);

  try {
    const clientDetails = await db
      .collection(clientCollection)
      .aggregate([
        { $match: { _id: clientId, status: "active" } },
        {
          $lookup: {
            from: projectCollection,
            localField: "_id",
            foreignField: "client_id",
            as: "projects",
          },
        },
        { $unwind: { path: "$projects", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: resourceCollection,
            localField: "projects._id",
            foreignField: "project_ids",
            as: "projects.resources",
          },
        },
        {
          $group: {
            _id: "$_id",
            name: { $first: "$name" },
            location: { $first: "$location" },
            type: { $first: "$type" },
            status: { $first: "$status" },
            created_at: { $first: "$created_at" },
            projects: { $push: "$projects" },
          },
        },
      ])
      .toArray();

    if (clientDetails.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(clientDetails[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET all clients
router.get("/clients", async (req, res) => {
  const db = getDb();
  try {
    const clients = await db.collection(clientCollection).find().toArray();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH client
router.patch("/clients/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    const update = req.body;
    await db.collection(clientCollection).updateOne({ _id: id }, { $set: update });
    const client = await db.collection(clientCollection).findOne({ _id: id });
    res.json({ client });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE client
router.delete("/clients/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    await db.collection(clientCollection).deleteOne({ _id: id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all projects
router.get("/projects", async (req, res) => {
  const db = getDb();
  try {
    const projects = await db.collection(projectCollection).find().toArray();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})
// PATCH project
router.patch("/projects/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    const update = req.body;
    await db.collection(projectCollection).updateOne({ _id: id }, { $set: update });
    const project = await db.collection(projectCollection).findOne({ _id: id });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE project
router.delete("/projects/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    await db.collection(projectCollection).deleteOne({ _id: id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all resources
router.get("/resources", async (req, res) => {
  const db = getDb();
  try {
    const resources = await db.collection(resourceCollection).find().toArray();
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH resource
router.patch("/resources/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    const { name, tech_stack, department, designation, salary, status, project_ids } = req.body;

    const project_names = await getMatchedProjectNames(tech_stack, db);

    const update = {
      name,
      tech_stack,
      department,
      designation,
      salary,
      status,
      project_names,
    };

    // Only update project_ids if provided
    if (project_ids) {
      update.project_ids = project_ids;
    }

    await db.collection(resourceCollection).updateOne({ _id: id }, { $set: update });
    const resource = await db.collection(resourceCollection).findOne({ _id: id });
    res.json({ resource });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE resource
router.delete("/resources/:id", async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    await db.collection(resourceCollection).deleteOne({ _id: id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET projects by client
router.get("/projects", async (req, res) => {
  const db = getDb();
  const client_id = parseInt(req.query.client_id);
  try {
    const projects = await db.collection(projectCollection).find({ client_id }).toArray();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;