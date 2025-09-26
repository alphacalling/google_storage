import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { config as loadEnv } from "dotenv";
import { initializeDatabase } from "./configs/database";
// import blobRouter from "../services/blob/server";

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envFile = path.resolve(__dirname, "../.env");
loadEnv({ path: envFile, override: true });
console.log("✅ Loaded env:", envFile);

// Ensure PORT is defined
if (!process.env.PORT) {
  console.error("❌ Environment variable PORT is required but not set");
  process.exit(1);
}
const PORT = Number(process.env.PORT);

// Create Express app
const app = express();

// JSON body parsing
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV });
});

// Initialize database
initializeDatabase()
  .then(() => console.log("✅ Database ready"))
  .catch((err) => {
    console.error("❌ DB init failed:", err);
    process.exit(1);
  });


// Start server
app.listen(PORT, () => {
  console.log(`✅ Express Server running on port: ${PORT}`);
});
