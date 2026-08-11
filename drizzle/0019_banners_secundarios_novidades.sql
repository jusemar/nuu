ALTER TYPE "public"."banner_home_posicao" ADD VALUE IF NOT EXISTS 'novidades_secundario_esquerdo';--> statement-breakpoint
ALTER TYPE "public"."banner_home_posicao" ADD VALUE IF NOT EXISTS 'novidades_secundario_direito';--> statement-breakpoint
DROP INDEX IF EXISTS "banners_home_um_secundario_ativo_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "banners_home_um_novidades_esquerdo_ativo_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "banners_home_um_novidades_direito_ativo_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "banners_home_uma_posicao_fixa_ativa_idx" ON "banners_home" USING btree ("posicao") WHERE "banners_home"."ativo" = true and "banners_home"."posicao" <> 'principal_esquerdo';
