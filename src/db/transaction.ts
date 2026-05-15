import "dotenv/config";

import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

export const dbTransacional = drizzle(process.env.DATABASE_URL!, {
  schema,
});
