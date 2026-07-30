# Histórico legado de migrations

Este diretório preserva integralmente a sequência Drizzle anterior à baseline
consolidada.

Os arquivos daqui são somente para auditoria e não fazem parte da sequência
ativa configurada em `drizzle.config.ts`.

Regras:

- não executar estes SQLs automaticamente;
- não editar migrations ou snapshots históricos;
- conferir a integridade pelo arquivo `manifesto-sha256.txt`;
- manter o diretório `drizzle/` reservado à nova sequência ativa;
- consultar o diagnóstico da Fase 3 antes de qualquer regularização adicional.

Estado preservado:

- 58 arquivos SQL;
- 11 snapshots;
- journal legado com 39 entradas;
- 19 SQLs ausentes do journal legado;
- lacuna numérica em `0025`;
- rastreamento real anterior mantido no banco em
  `drizzle.__drizzle_migrations`.
