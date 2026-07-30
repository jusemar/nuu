# Evidência do teste de continuidade da baseline

Esta pasta preserva, apenas para auditoria, as migrations sintéticas usadas para
comprovar que a sequência posterior à baseline funciona nos dois ambientes
descartáveis.

- `0001_teste_migration_sintetica_criar.sql` criou uma tabela vazia e isolada.
- `0002_teste_migration_sintetica_remover.sql` removeu integralmente essa tabela.
- `meta/` contém os snapshots e o journal completo do ciclo de teste.

Esses arquivos não pertencem à sequência ativa em `drizzle/` e não devem ser
executados pelo migrator da aplicação. Após a validação, os dois bancos
descartáveis retornaram ao fingerprint público anterior ao teste e os registros
sintéticos foram removidos do rastreamento `drizzle_v2`.
