import express from "express";
import cors from "cors";
import { config as loadEnv } from "dotenv";
import path from "path";
// Blob routes
import uploadRouter from "./routes/upload";
import authRouter from './routes/auth'

// Load environment variables from project root
loadEnv({ path: path.resolve(process.cwd(), ".env"), override: true });
console.log("✅ Loaded env:", path.resolve(process.cwd(), ".env"));

// Ensure BLOB_PORT is set
if (!process.env.BLOB_PORT) {
  console.error("❌ Environment variable BLOB_PORT is required but not set");
  process.exit(1);
}

const PORT = Number(process.env.BLOB_PORT);
if (isNaN(PORT) || PORT <= 0 || PORT >= 65536) {
  console.error(`❌ Invalid BLOB_PORT: ${process.env.BLOB_PORT}`);
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// app.use("/", blobRouter);
app.use("/auth", authRouter);
app.use("/upload", uploadRouter);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Blob service running on port ${PORT}`);
});
