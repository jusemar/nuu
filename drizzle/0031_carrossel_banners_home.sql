ALTER TABLE "banners_home" ALTER COLUMN "titulo" DROP NOT NULL;

DROP INDEX IF EXISTS "banners_home_um_ativo_por_posicao_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "banners_home_um_secundario_ativo_idx"
ON "banners_home" ("posicao")
WHERE "ativo" = true AND "posicao" = 'secundario_direito';
