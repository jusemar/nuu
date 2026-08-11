INSERT INTO "banners_home" (
  "posicao",
  "nome",
  "tipo_banner",
  "modelo_svg",
  "variacao_visual",
  "cor_fundo",
  "cor_texto",
  "cor_destaque",
  "titulo",
  "subtitulo",
  "texto_apoio",
  "tipo_destaque",
  "ativo",
  "ordem"
)
SELECT
  'produto_institucional',
  'Banner institucional da página de produto',
  'svg',
  'linhas_institucionais',
  'azul_ambar',
  '#0A4F8A',
  '#FFFFFF',
  '#FBBF24',
  'Espaço para uma campanha institucional da loja',
  'Conteúdo demonstrativo',
  'Este banner será conectado somente quando houver uma campanha real e ativa.',
  'institucional',
  true,
  0
WHERE NOT EXISTS (
  SELECT 1
  FROM "banners_home"
  WHERE "posicao" = 'produto_institucional'
);
