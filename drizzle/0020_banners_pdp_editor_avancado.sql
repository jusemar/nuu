ALTER TYPE "public"."banner_home_destaque" ADD VALUE IF NOT EXISTS 'informativo';--> statement-breakpoint
ALTER TYPE "public"."banner_home_destaque" ADD VALUE IF NOT EXISTS 'minimalista';--> statement-breakpoint
ALTER TYPE "public"."banner_home_posicao" ADD VALUE IF NOT EXISTS 'produto_institucional';--> statement-breakpoint
ALTER TABLE "banners_home" ADD COLUMN "nome" text;--> statement-breakpoint
ALTER TABLE "banners_home" ADD COLUMN "cor_fundo" text;--> statement-breakpoint
ALTER TABLE "banners_home" ADD COLUMN "cor_texto" text;--> statement-breakpoint
ALTER TABLE "banners_home" ADD COLUMN "cor_destaque" text;--> statement-breakpoint
ALTER TABLE "banners_home" ADD COLUMN "data_inicio" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "banners_home" ADD COLUMN "data_fim" timestamp with time zone;
