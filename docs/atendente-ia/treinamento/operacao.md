# Operação e troubleshooting

Antes de diagnosticar o painel, confirme sessão administrativa, `ADMIN_EMAILS`, papel ativo e migrations 0007–0014. Erros inesperados permanecem no Error Boundary; falha de banco não é convertida em estado vazio falso.

Para migrations, use somente conexão descartável explícita em `DATABASE_URL_MIGRACOES` e execute `npx drizzle-kit migrate`. Nunca reaplique a cadeia em produção sem conferir o journal da própria implantação.

Se o chat falhar após ativação, desligue `ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS`, reinicie/reimplante o runtime e confirme o fallback. Não altere versões ou fragmentos manualmente. Preserve auditorias e identidades para investigação.

Validações locais recomendadas: testes unitários, integrações em PostgreSQL pgvector descartável, typecheck direcionado, ESLint, build e verificação autenticada das cinco rotas.
