CREATE TABLE IF NOT EXISTS "marca" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "nome" text NOT NULL,
  "slug" text NOT NULL,
  "descricao" text,
  "logo_url" text,
  "ativo" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "marca_slug_unique" UNIQUE("slug")
);

CREATE INDEX IF NOT EXISTS "marca_nome_idx" ON "marca" USING btree ("nome");
CREATE INDEX IF NOT EXISTS "marca_slug_idx" ON "marca" USING btree ("slug");

INSERT INTO "marca" ("nome", "slug", "descricao", "ativo")
VALUES ('Genérico', 'generico', 'Marca padrão para produtos sem marca específica.', true)
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "product"
ADD COLUMN IF NOT EXISTS "marca_id" uuid;

INSERT INTO "marca" ("nome", "slug", "ativo")
SELECT
  trim(p.brand) AS nome,
  lower(
    regexp_replace(
      regexp_replace(trim(p.brand), '[^a-zA-Z0-9]+', '-', 'g'),
      '(^-+|-+$)',
      '',
      'g'
    )
  ) AS slug,
  true
FROM "product" p
WHERE p.brand IS NOT NULL
  AND trim(p.brand) <> ''
ON CONFLICT ("slug") DO NOTHING;

UPDATE "product" p
SET "marca_id" = m.id
FROM "marca" m
WHERE p.brand IS NOT NULL
  AND trim(p.brand) <> ''
  AND lower(
    regexp_replace(
      regexp_replace(trim(p.brand), '[^a-zA-Z0-9]+', '-', 'g'),
      '(^-+|-+$)',
      '',
      'g'
    )
  ) = m.slug
  AND p.marca_id IS NULL;

UPDATE "product" p
SET "marca_id" = m.id
FROM "marca" m
WHERE m.slug = 'generico'
  AND p.marca_id IS NULL;

ALTER TABLE "product"
ALTER COLUMN "marca_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_marca_id_marca_id_fk'
  ) THEN
    ALTER TABLE "product"
    ADD CONSTRAINT "product_marca_id_marca_id_fk"
      FOREIGN KEY ("marca_id")
      REFERENCES "marca"("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "product_marca_id_idx" ON "product" USING btree ("marca_id");
