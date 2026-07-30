ALTER TABLE "product_own_delivery_prices"
ADD COLUMN IF NOT EXISTS "scheduled_delivery_active" boolean DEFAULT false NOT NULL;

ALTER TABLE "product_own_delivery_prices"
ADD COLUMN IF NOT EXISTS "scheduled_delivery_min_days" integer;

ALTER TABLE "product_own_delivery_prices"
ADD COLUMN IF NOT EXISTS "scheduled_delivery_price" integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'product_own_delivery_prices_scheduled_min_days_check'
  ) THEN
    ALTER TABLE "product_own_delivery_prices"
    ADD CONSTRAINT "product_own_delivery_prices_scheduled_min_days_check"
    CHECK ("scheduled_delivery_min_days" IS NULL OR "scheduled_delivery_min_days" >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'product_own_delivery_prices_scheduled_price_check'
  ) THEN
    ALTER TABLE "product_own_delivery_prices"
    ADD CONSTRAINT "product_own_delivery_prices_scheduled_price_check"
    CHECK ("scheduled_delivery_price" IS NULL OR "scheduled_delivery_price" >= 0);
  END IF;
END $$;
