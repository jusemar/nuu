WITH banners_ordenados AS (
  SELECT
    "id",
    "posicao",
    row_number() OVER (
      PARTITION BY "posicao"
      ORDER BY "created_at", "id"
    ) AS numero,
    count(*) OVER (PARTITION BY "posicao") AS total_posicao
  FROM "banners_home"
), nomes AS (
  SELECT
    "id",
    CASE "posicao"
      WHEN 'principal_esquerdo' THEN 'Banner Principal ' || "numero"
      WHEN 'secundario_direito' THEN
        'Banner Complementar Superior' ||
        CASE WHEN "total_posicao" > 1 THEN ' ' || "numero" ELSE '' END
      WHEN 'novidades_secundario_esquerdo' THEN
        'Banner Secundário Esquerdo' ||
        CASE WHEN "total_posicao" > 1 THEN ' ' || "numero" ELSE '' END
      WHEN 'novidades_secundario_direito' THEN
        'Banner Secundário Direito' ||
        CASE WHEN "total_posicao" > 1 THEN ' ' || "numero" ELSE '' END
      WHEN 'produto_institucional' THEN
        'Banner Institucional PDP' ||
        CASE WHEN "total_posicao" > 1 THEN ' ' || "numero" ELSE '' END
    END AS nome
  FROM banners_ordenados
)
UPDATE "banners_home" AS banner
SET
  "nome" = nomes.nome,
  "updated_at" = now()
FROM nomes
WHERE banner."id" = nomes."id"
  AND (banner."nome" IS NULL OR btrim(banner."nome") = '');
