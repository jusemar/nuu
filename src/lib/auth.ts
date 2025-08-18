import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import * as schema from "@/db/schema"; // your drizzle schema
 
 
export const auth = betterAuth({

    emailAndPassword: {
        enabled: true,
    },

    database: drizzleAdapter(db, {
        provider: "pg",
        schema, // or "mysql", "sqlite"
    }),
    user: {
        modelName: "userTable", // the name of your user model    
    },
    session: {
        modelName: "sessionTable", // the name of your session model
    },
    account: {
        modelName: "accountTable", // the name of your account model
    },

});

