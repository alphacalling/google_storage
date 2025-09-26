import mysql, { Pool } from "mysql2/promise";
import fs from "fs";
import path from "path";

// Helper to assert env vars exist
function getEnvVar(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Environment variable ${name} is required`);
  return val;
}

// Create DB if it doesn't exist
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
    await tempPool.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
  } finally {
    await tempPool.end();
  }
}

let pool: Pool | null = null;

export async function initializeDatabase() {
  const config = {
    host: getEnvVar("DB_HOST"),
    user: getEnvVar("DB_USER"),
    password: getEnvVar("DB_PASSWORD"),
    database: getEnvVar("DB_NAME"),
  };

  // Ensure database exists
  await createDatabaseIfNeeded(config);

  // Create persistent pool
  if (!pool) {
    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  // Run schema from setup.sql
  const setupSql = fs.readFileSync(path.join(__dirname, "setup.sql"), "utf8");
  const statements = setupSql
    .split(/;\s*\n/gm)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      console.log("Executing:", statement.substring(0, 80) + "...");
      await pool.query(statement);
    } catch (err: any) {
      console.error("Error executing SQL:", err.message);
    }
  }

  console.log("✅ Database initialized");
}

// Getter for the pool
export function getDb(): Pool {
  if (!pool) throw new Error("Database not initialized. Call initializeDatabase() first.");
  return pool;
}
