import { defineConfig } from "drizzle-kit";

const target = process.env.DRIZZLE_TARGET || "dev";

let databaseUrl =
  target === "prod"
    ? process.env.PROD_DATABASE_URL
    : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    target === "prod"
      ? "PROD_DATABASE_URL is not set"
      : "DATABASE_URL is not set"
  );
}

if (target === "prod") {
  databaseUrl = databaseUrl.replace(":6543/", ":5432/");
}

console.log(`Drizzle target: ${target === "prod" ? "Production (Supabase)" : "Development (Replit)"}`);

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
    ssl: target === "prod" ? "require" : false,
  },
});
