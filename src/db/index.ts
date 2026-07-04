import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

// During build time, DATABASE_URL might be missing. 
// We provide a fallback or handle it gracefully to allow the build to succeed.
if (!databaseUrl && process.env.NODE_ENV === "production") {
  console.warn("DATABASE_URL is missing. Database connection will fail at runtime if not provided.");
}

export const pool = new Pool({
  connectionString: databaseUrl || "postgres://postgres:postgres@127.0.0.1:5432/app_db",
});

export const db = drizzle(pool);
