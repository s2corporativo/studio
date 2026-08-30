import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./drizzle/schema.ts",
    "./drizzle/socialOsSchema.ts",
    "./drizzle/socialGrowthSchema.ts",
    "./drizzle/socialAutomationSchema.ts",
  ],
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./db/social-studio.db",
  },
});
