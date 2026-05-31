DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'banner_home_posicao') THEN
    CREATE TYPE "banner_home_posicao" AS ENUM ('principal_esquerdo', 'secundario_direito');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'banner_home_tipo') THEN
    CREATE TYPE "banner_home_tipo" AS ENUM ('svg', 'imagem');
  END IF;
END $$;

ALTER TYPE "banner_home_tipo" ADD VALUE IF NOT EXISTS 'imagem';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'banner_home_destaque') THEN
    CREATE TYPE "banner_home_destaque" AS ENUM ('promocao', 'oferta', 'lancamento', 'institucional');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "banners_home" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "posicao" "banner_home_posicao" NOT NULL,
  "tipo_banner" "banner_home_tipo" DEFAULT 'svg' NOT NULL,
  "modelo_svg" text NOT NULL,
  "variacao_visual" text DEFAULT 'azul_ambar' NOT NULL,
  "titulo" text NOT NULL,
  "subtitulo" text,
  "texto_apoio" text,
  "preco_chamada" text,
  "texto_botao" text,
  "link_botao" text,
  "imagem_url" text,
  "imagem_alt" text,
  "imagem_mobile_url" text,
  "foco_imagem" text DEFAULT 'center' NOT NULL,
  "tamanho_imagem" text DEFAULT 'cover' NOT NULL,
  "metadata_imagem" jsonb,
  "tipo_destaque" "banner_home_destaque" DEFAULT 'oferta' NOT NULL,
  "ativo" boolean DEFAULT false NOT NULL,
  "ordem" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "banners_home_posicao_idx" ON "banners_home" USING btree ("posicao");
CREATE INDEX IF NOT EXISTS "banners_home_ativo_idx" ON "banners_home" USING btree ("ativo");
CREATE INDEX IF NOT EXISTS "banners_home_ordem_idx" ON "banners_home" USING btree ("ordem");

CREATE UNIQUE INDEX IF NOT EXISTS "banners_home_um_ativo_por_posicao_idx"
ON "banners_home" ("posicao")
WHERE "ativo" = true;

ALTER TABLE "banners_home" ADD COLUMN IF NOT EXISTS "imagem_url" text;
ALTER TABLE "banners_home" ADD COLUMN IF NOT EXISTS "imagem_alt" text;
ALTER TABLE "banners_home" ADD COLUMN IF NOT EXISTS "imagem_mobile_url" text;
ALTER TABLE "banners_home" ADD COLUMN IF NOT EXISTS "foco_imagem" text DEFAULT 'center' NOT NULL;
ALTER TABLE "banners_home" ADD COLUMN IF NOT EXISTS "tamanho_imagem" text DEFAULT 'cover' NOT NULL;
ALTER TABLE "banners_home" ADD COLUMN IF NOT EXISTS "metadata_imagem" jsonb;
