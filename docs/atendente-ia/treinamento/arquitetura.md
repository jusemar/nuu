# Arquitetura

O domínio único é `src/features/atendimento-ia`:

- `components/store`: experiência pública.
- `components/admin`: experiência de treinamento.
- `actions`: mutações autenticadas por Server Actions.
- `queries/admin`: leituras server-only, autorizadas e sanitizadas.
- `lib/admin`: regras puras ou serviços transacionais de treinamento.
- `schemas/admin`: validação Zod.
- `src/db/tables/atendimento-ia`: source of truth Drizzle.

`index.ts` exporta somente UI pública. `admin.ts` é o barrel administrativo. Rotas importam preferencialmente arquivos diretos para evitar dependências transitivas.

O laboratório usa contexto controlado, simuladores determinísticos e `tools: []`. Ele não importa o orquestrador público nem repositórios de ferramentas reais. Candidatos só chegam ao público após publicação concluída e, enquanto a feature flag estiver desligada, o fluxo legado continua ativo.
