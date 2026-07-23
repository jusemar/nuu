ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "whatsapp" text;

CREATE UNIQUE INDEX IF NOT EXISTS "user_whatsapp_unique"
ON "user" USING btree ("whatsapp");
