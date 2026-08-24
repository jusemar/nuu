ALTER TABLE "convites_administrativos" ADD COLUMN "nome_destinatario" text;
UPDATE "convites_administrativos"
SET "nome_destinatario" = split_part("email_destinatario", '@', 1)
WHERE "nome_destinatario" IS NULL;
ALTER TABLE "convites_administrativos" ALTER COLUMN "nome_destinatario" SET NOT NULL;
