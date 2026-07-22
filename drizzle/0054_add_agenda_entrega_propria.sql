ALTER TABLE "shipping_regions"
  ADD COLUMN IF NOT EXISTS "agenda_ativa" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "horario_corte" varchar(5),
  ADD COLUMN IF NOT EXISTS "periodo_entrega_inicio" varchar(5),
  ADD COLUMN IF NOT EXISTS "periodo_entrega_fim" varchar(5);

-- Mantém o registro mais antigo de cada dia antes de impedir duplicidades.
DELETE FROM "shipping_region_slots" atual
USING "shipping_region_slots" preservado
WHERE atual."region_id" = preservado."region_id"
  AND atual."day_of_week" = preservado."day_of_week"
  AND atual."id" > preservado."id";

DELETE FROM "shipping_bairro_avulso_slots" atual
USING "shipping_bairro_avulso_slots" preservado
WHERE atual."bairro_avulso_id" = preservado."bairro_avulso_id"
  AND atual."day_of_week" = preservado."day_of_week"
  AND atual."id" > preservado."id";

CREATE UNIQUE INDEX IF NOT EXISTS "shipping_region_slots_region_day_unique"
  ON "shipping_region_slots" ("region_id", "day_of_week");

CREATE UNIQUE INDEX IF NOT EXISTS "shipping_bairro_avulso_slots_bairro_day_unique"
  ON "shipping_bairro_avulso_slots" ("bairro_avulso_id", "day_of_week");
