# Operação e troubleshooting

Antes de diagnosticar o painel, confirme sessão administrativa, `ADMIN_EMAILS`, papel ativo e migrations 0007–0014. Erros inesperados permanecem no Error Boundary; falha de banco não é convertida em estado vazio falso.

Para migrations de desenvolvimento, use `npm run migrations:validar`: ele testa primeiro o clone temporário e a cadeia completa em banco vazio. Nunca reaplique a cadeia em produção sem conferir o journal da própria implantação e obter aprovação específica.

Se o chat falhar após ativação, desligue `ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS`, reinicie/reimplante o runtime e confirme o fallback. Não altere versões ou fragmentos manualmente. Preserve auditorias e identidades para investigação.

Validações locais recomendadas: testes unitários, integrações em PostgreSQL pgvector descartável, typecheck direcionado, ESLint, build e verificação autenticada das cinco rotas.
