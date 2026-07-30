ALTER TABLE "product"
ADD COLUMN IF NOT EXISTS "product_kind" text NOT NULL DEFAULT 'simple';
