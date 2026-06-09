DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promocao_tipo_campanha') THEN
    CREATE TYPE "promocao_tipo_campanha" AS ENUM ('normal', 'relampago');
  END IF;
END $$;

ALTER TABLE "regras_promocao"
ADD COLUMN IF NOT EXISTS "tipo_campanha" "promocao_tipo_campanha" DEFAULT 'normal' NOT NULL;

ALTER TABLE "regras_promocao"
ADD COLUMN IF NOT EXISTS "badge_promocional" text;

ALTER TABLE "regras_promocao"
ADD COLUMN IF NOT EXISTS "countdown_promocional_data_fim" timestamp;

CREATE INDEX IF NOT EXISTS "regras_promocao_tipo_campanha_idx"
ON "regras_promocao" ("tipo_campanha");
