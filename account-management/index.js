const express = require("express");
const dotenv = require("dotenv");
const { connectToMongo } = require("./db");
const { initializeClientCollection } = require("./models/client");
const { initializeProjectCollection } = require("./models/project");
const { initializeResourceCollection } = require("./models/resource");
const apiRoutes = require("./routes/api");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

async function startServer() {
  try {
    await connectToMongo(); 
   
    await initializeClientCollection();
    await initializeProjectCollection();
    await initializeResourceCollection();

    app.use("/api", apiRoutes);
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();