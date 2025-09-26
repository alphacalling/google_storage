import mysql, { Pool } from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config as loadEnv } from "dotenv";

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment based on NODE_ENV
const envFile =
  process.env.NODE_ENV === "development"
    ? path.resolve(__dirname, "../../.env.local")
    : path.resolve(__dirname, "../../.env");

loadEnv({ path: envFile, override: true });
console.log(`✅ Loaded env: ${envFile}`);

let pool: Pool | null = null;

function getEnvVar(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Environment variable ${name} is required`);
  return val;
}

async function createDatabaseIfNeeded(config: {
  host: string;
  user: string;
  password: string;
  database: string;
}) {
  const tempPool = await mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
  });

  try {
    await tempPool.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\``
    );
  } finally {
    await tempPool.end();
  }
}

export async function initializeDatabase() {
  const config = {
    host: getEnvVar("DB_HOST"),
    user: getEnvVar("DB_USER"),
    password: getEnvVar("DB_PASSWORD"),
    database: getEnvVar("DB_NAME"),
  };

  await createDatabaseIfNeeded(config);

  if (!pool) {
    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  const setupSql = fs.readFileSync(path.join(__dirname, "index.sql"), "utf8");
  const statements = setupSql
    .split(/;\s*\n/gm)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err: any) {
      console.error("Error executing SQL:", err.message);
    }
  }

  console.log("✅ Database initialized");
}

export function getDb(): Pool {
  if (!pool)
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  return pool;
}
