# Procedimento protegido de adoção da baseline em production

Este documento prepara uma futura adoção. Ele não autoriza a execução do stamp.

## Pré-condições

- aprovação explícita para escrita na production;
- janela operacional definida;
- sequência ativa em `drizzle/` contendo somente a baseline consolidada;
- working tree e artefato implantado correspondendo à versão aprovada;
- `DATABASE_URL` principal mantida exclusivamente no arquivo local `.env`;
- fingerprint estrutural esperado:
  `7efa668e4899a8ce4160336d27d876c26dfc0ea9b0d2b18fc2a2cfb327788c4d`;
- snapshot ou ponto de restauração Neon criado e identificado imediatamente antes.

## Backup e restauração no Neon

Procedimento recomendado:

1. abrir **Backup & Restore** no Console Neon;
2. selecionar a branch `production`;
3. criar um snapshot manual imediatamente antes da janela;
4. registrar o identificador, horário e retenção do snapshot;
5. confirmar no Console que o snapshot terminou e está disponível;
6. manter o snapshot até o encerramento da validação e da janela de observação.

Se snapshots não estiverem disponíveis no plano, criar uma branch filha da
production no ponto imediatamente anterior ao stamp, sem expiração curta, e
validar que ela contém o mesmo fingerprint e dados. Essa branch funciona como
ponto isolado de recuperação, mas a restauração exige o fluxo de restore/promote
do Neon.

Em caso de rollback, restaurar o snapshot para a branch ativa pelo fluxo
**Backup & Restore**. A restauração finalizada preserva o endpoint/connection
string, mas pode substituir o ID interno da branch. Por isso, após qualquer
restore, o ID da branch deve ser consultado novamente e as constantes de
proteção do script precisam passar por nova revisão antes de outra tentativa.

Referências oficiais:

- [Database versioning with snapshots](https://neon.com/docs/ai/ai-database-versioning)
- [Point-in-time restore](https://neon.com/blog/announcing-point-in-time-restore)

## Ordem exata da futura execução

1. interromper jobs administrativos e migrations concorrentes;
2. registrar horário de início da janela;
3. criar e confirmar o snapshot ou branch de recuperação;
4. executar novamente a inspeção somente leitura:

   ```bash
   npx tsx scripts/adotar-baseline-production.ts --inspecionar
   ```

5. conferir identidade, 80 tabelas administradas, tabela órfã, ausência do
   rastreamento v2 e os fingerprints esperados;
6. somente após autorização específica, executar:

   ```bash
   npx tsx scripts/adotar-baseline-production.ts --executar-stamp-production --confirmar=ADOTAR_BASELINE_NA_PRODUCTION --fingerprint=7efa668e4899a8ce4160336d27d876c26dfc0ea9b0d2b18fc2a2cfb327788c4d
   ```

7. executar novamente `--inspecionar`;
8. confirmar que `drizzle_v2.__drizzle_migrations` possui exatamente uma linha
   e que ela corresponde à baseline;
9. confirmar fingerprints estrutural e de dados inalterados;
10. confirmar a presença da tabela órfã;
11. executar o modo protegido do migrator e comprovar no-op:

   ```bash
   npx tsx scripts/adotar-baseline-production.ts --validar-migrator-no-op-production --confirmar=VALIDAR_MIGRATOR_NO_OP_NA_PRODUCTION --fingerprint=7efa668e4899a8ce4160336d27d876c26dfc0ea9b0d2b18fc2a2cfb327788c4d
   ```

12. manter o snapshot durante a janela de observação.

## Escopo do script

O script não chama o migrator e não lê ou executa
`0000_baseline_consolidada.sql`. A futura transação cria somente o schema
`drizzle_v2`, sua tabela de rastreamento e o registro da baseline.

Qualquer divergência de URL, projeto, branch, endpoint, banco, sequência ativa,
fingerprint, tabelas administradas, tabela órfã, confirmação ou rastreamento
existente provoca rollback ou recusa antes da escrita.
