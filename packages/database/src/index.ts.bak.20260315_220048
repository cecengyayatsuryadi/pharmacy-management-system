import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import * as dotenv from "dotenv"
import path from "node:path"

// Load .env from the root of the database package or apps/web
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

const connectionString = process.env.DATABASE_URL as string

if (!connectionString) {
  console.warn("DATABASE_URL is not set. Database connection will fail.")
}

const conn = globalForDb.conn ?? postgres(connectionString)
if (process.env.NODE_ENV !== "production") globalForDb.conn = conn

export const db = drizzle(conn, { schema })
export * from "./schema"
