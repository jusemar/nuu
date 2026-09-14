# Ambientes de banco e execução de scripts

Documento operacional. Vale para qualquer script que toque o banco.

**Regra única:** desenvolvimento local nunca usa o banco principal. Produção só recebe
escrita por comando dedicado, com autorização explícita.

---

## 0. Regra para qualquer sessão (humana ou IA)

- **O padrão é o PostgreSQL LOCAL persistente.** Ele já existe: `nooo-postgres-local`.
  **Nunca crie outro container/banco de desenvolvimento.** Reutilize este (`npm run db:local:subir`).
- Testes, fixtures e ensaios de migration usam **PostgreSQL descartável** (Docker, removido ao final).
- Neon só quando explícito: `npm run dev:neon` (validação online) e `npm run migrations:producao`
  (aplicação final, uma vez, autorizada).
- **Nunca criar branch Neon.** A Neon tem somente `production` e `desenvolvimento-local`.

---

## 1. Os ambientes

| Ambiente                 | Onde                                                                        | Para que serve                                                        |
| ------------------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **local** (padrão)       | Docker `nooo-postgres-local`, `127.0.0.1:55432/nooo_desenvolvimento`        | `npm run dev`, seeds, importações, manutenção, admin local            |
| descartável              | Docker `nuu-validacao-migrations-*` / `nuu-testes-logistica-*`, porta livre | migrations repetidas, integração, fixtures; removido ao final         |
| `desenvolvimento` (Neon) | branch `desenvolvimento-local` (`ep-quiet-bar-acb7yly2`)                    | homologação online, somente por comando explícito                     |
| `producao` (Neon)        | branch `production` (`ep-proud-bonus-acy2bafx`)                             | aplicação publicada; local só via `dev:neon` ou `migrations:producao` |

### PostgreSQL local persistente

| Item      | Valor                                                              |
| --------- | ------------------------------------------------------------------ |
| container | `nooo-postgres-local` (`--restart unless-stopped`)                 |
| imagem    | `pgvector/pgvector:pg17` (PostgreSQL 17 + pgvector)                |
| volume    | `nooo-postgres-local-dados` (dados sobrevivem a stop, rm e reboot) |
| porta     | `127.0.0.1:55432` (nunca exposta fora da máquina)                  |
| banco     | `nooo_desenvolvimento`, usuário `nooo`                             |
| senha     | só na `DATABASE_URL` de `.env.local` (não versionado)              |

```bash
npm run db:local:subir    # cria na 1ª vez / inicia se parado (o npm run dev faz isso sozinho)
npm run db:local:parar    # para; os dados ficam no volume
npm run db:local:status   # estado, PostgreSQL, pgvector e migrations aplicadas
```

Máquina nova: crie `.env.local` com `DATABASE_URL="postgresql://nooo:<senha-local>@127.0.0.1:55432/nooo_desenvolvimento"`,
depois `npm run db:local:subir`, `npm run migrations:local` e os seeds da seção 3.

---

## 2. Qual arquivo de ambiente cada comando usa

| Comando                                                | Arquivo lido                                                                   | Destino                                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------- |
| `npm run dev`                                          | `.env.local` (`DATABASE_URL` local)                                            | **PostgreSQL local persistente**              |
| `npm run dev:neon`                                     | `.env.dev-neon.local` (`DATABASE_URL` Neon + `APP_ENVIRONMENT`) + `.env.local` | Neon, somente neste processo                  |
| `npm run build` / `start`                              | `.env.local`                                                                   | PostgreSQL local                              |
| `npm run seed:*`, `import:*`, `manutencao:*`, `rbac:*` | `.env.local` (`AMBIENTE_BANCO=local`)                                          | PostgreSQL local persistente                  |
| `npm run migrations:local`                             | `.env.local`                                                                   | PostgreSQL local persistente                  |
| `npm run migrations:validar-apenas`                    | nenhum                                                                         | PostgreSQL descartável (Docker)               |
| `npm run migrations:validar`                           | `.env.local`                                                                   | descartável e, se aprovado, local persistente |
| `npm run testes:integracao:logistica`                  | nenhum                                                                         | PostgreSQL descartável (Docker)               |
| `npm run migrations:homologacao[:pre-validar]`         | `.env.neon.local`, `.env.desenvolvimento.local`                                | Neon `desenvolvimento-local` (explícito)      |
| `npm run migrations:producao`                          | `.env` + autorização explícita                                                 | Neon `production` (explícito)                 |
| `npx drizzle-kit generate`                             | `DATABASE_URL_MIGRACOES` informada na própria linha                            | o que for informado                           |

Como a troca acontece sem editar arquivos: `scripts/iniciar-dev.ts` define `DATABASE_URL`
no ambiente **do processo** antes de iniciar o Next. O Next não sobrescreve variáveis já
presentes, então o valor do lançador vence `.env.local`. Ao encerrar `dev:neon`, o próximo
`npm run dev` volta ao local.

Travas contra Neon acidental:

- em `next dev`, `src/db/connection.ts` e `src/db/transaction.ts` recusam banco não-local
  sem `NOOO_BANCO_NEON_EXPLICITO=sim` (marcado só pelo `dev:neon`);
- a guarda dos scripts (`AMBIENTE_BANCO=local`) exige exatamente o container persistente,
  conferido pelo `cluster_name` do servidor.

`APP_ENVIRONMENT`: `homologacao` no local (Laquila/Efí de homologação); `dev:neon` usa o
valor de `.env.dev-neon.local` (hoje `producao`, porque o banco é o de produção). **No
`dev:neon`, integrações sensíveis (Laquila, Efí, Frenet) agem como produção — use com cuidado.**

`.env` guarda a URL de produção documentada (usada só por `migrations:producao`).
Todos os `.env*` são ignorados pelo git. Nenhuma credencial é versionada.

---

## 3. Comandos do dia a dia

```bash
npm run dev                            # Next + PostgreSQL local (sobe o container se preciso)
npm run migrations:local               # aplica migrations no local (repetível)
npm run seed:desenvolvimento-local     # dados fictícios: BH, agenda, categorias, produtos, heranças
npm run seed:logistica-dados-iniciais  # catálogo oficial de frete (idempotente)
npm run rbac:sincronizar-catalogo      # permissões do admin
npm run rbac:sincronizar-presets
npm run testes:integracao:logistica    # integração em banco descartável
npm run migrations:validar-apenas      # 0 → última e penúltima → última, descartável
npm run migrations:validar             # valida no descartável e aplica no local persistente
```

### Admin local

Criado pela arquitetura oficial (Better Auth + RBAC), somente no banco local:

```bash
ADMIN_SEED_NAME="Admin Local" ADMIN_SEED_EMAIL=<email> ADMIN_SEED_PASSWORD=<senha> npm run seed:admin-teste
ADMIN_EMAILS=<email> PROPRIETARIO_ADMIN_USER_ID=<id do usuário> npm run rbac:bootstrap-principal
```

Nesta máquina o admin já existe; e-mail e senha estão em `.env.admin-local.local` (não
versionado). Login em `http://localhost:3000/admin/login`.

Scripts com guarda imprimem o destino antes de escrever:

```
┌──────────────────────────────────────────────────────────
│ DESTINO DO BANCO: LOCAL
│ endpoint : nooo-postgres-local
│ host     : 127.0.0.1
└──────────────────────────────────────────────────────────
```

Se aparecer `ep-proud-bonus-acy2bafx`, é PRODUÇÃO — interrompa.

---

## 4. Comandos proibidos

```bash
npx tsx scripts/seed-dados-iniciais-logistica.ts     # sem lançador: bloqueado
npx tsx scripts/import-shipping-zip-addresses.ts     # idem
npx drizzle-kit migrate                              # sem DATABASE_URL_MIGRACOES explícita
```

Executar um script direto é bloqueado em duas camadas independentes — ver seção 5.

Nunca aponte `.env.local` para a Neon: ele é do PostgreSQL local. Neon no Next local é
só via `npm run dev:neon` (`.env.desenvolvimento.local` é da homologação explícita).

---

## 5. Como a proteção funciona

Duas camadas independentes. Furar uma não basta.

### Camada 1 — `scripts/lib/guarda-banco-local.ts`

Aplicada pelo lançador `scripts/lib/executar-script-local.ts`, por onde passam todos os
comandos locais de banco. Antes de abrir qualquer conexão:

1. exige `AMBIENTE_BANCO` explícito (sem ela, nada roda);
2. lê a URL do arquivo daquele ambiente — nunca de `.env` (`local` → `.env.local`, que precisa
   ser exatamente o container persistente, conferido pelo `cluster_name`);
3. recusa o endpoint de produção sempre que `AMBIENTE_BANCO` não for `producao`;
4. recusa qualquer endpoint fora da lista permitida;
5. confirma no servidor, em `BEGIN READ ONLY`, que a branch/endpoint são os esperados;
6. imprime o destino e só então define `process.env.DATABASE_URL`.

Os passos 1 a 4 são validação de string: quando o destino é recusado, **nenhum socket é
aberto**, muito menos transação.

### Camada 2 — `src/db/connection.ts`

Protege quem contornar o lançador. O módulo distingue **como** a URL chegou:

- **explícita** — `DATABASE_URL` já estava no ambiente (Vercel, `npm run dev`, lançador):
  aceita, alguém escolheu de propósito;
- **implícita** — ninguém definiu e o `dotenv` teve de ler `.env`: se apontar para produção,
  **recusa**.

Era exatamente esse caminho implícito que permitia a um seed local falar com o banco
principal.

### Por que o lançador existe

`import` de módulo ES é içado: roda antes de qualquer instrução do arquivo. Um script com
`import { db } from "@/db/connection"` abriria a conexão antes de qualquer guarda escrita no
corpo dele. O lançador inverte a ordem — valida, fixa `DATABASE_URL`, e só então importa o
alvo dinamicamente.

---

## 6. Operar em produção

Não existe comando pronto, e isso é proposital. Um script novo precisa chamar
`exigirBancoProducao(<operacao>)`, que exige tudo junto:

- `AMBIENTE_BANCO=producao`;
- `AUTORIZACAO_PRODUCAO="SIM-EU-AUTORIZO-<operacao>"` com o valor exato;
- validação do endpoint contra a lista;
- confirmação da identidade no servidor.

O lançador local recusa `AMBIENTE_BANCO=producao` por construção: comando de produção nunca
reaproveita o caminho local.

Migration em produção continua exigindo, além disso, auditoria específica e aprovação
separada — ver o bloqueio registrado no início de qualquer sessão.

---

## 7. Fluxo de migrations

**Local (repetível, quantas vezes precisar):**

1. alterar o schema Drizzle e gerar a migration (`npx drizzle-kit generate` com
   `DATABASE_URL_MIGRACOES` descartável na linha de comando);
2. `npm run migrations:validar-apenas` — PostgreSQL 17 descartável em Docker, só em
   `127.0.0.1`, com `cluster_name` único: aplica `0000 → última` e `penúltima → última`
   (ou `--atualizar-a-partir-de=<N>`) e exige estruturas idênticas;
3. `npm run migrations:validar` (ou `migrations:local`) — aplica no banco local persistente;
4. testes e validação manual no `npm run dev`.

**Neon (uma vez, no fim da implementação aprovada):**

5. `npm run migrations:producao -- --conferir` e depois `--somente=<tag>` com
   `AUTORIZACAO_PRODUCAO` explícita;
6. git, push e deploy.

Nunca usar a Neon para testar ou ensaiar migration. Nunca aplicar repetidamente na Neon.
**Nenhum comando cria branch Neon** — o cliente da API em `validar-e-aplicar-migrations.ts`
é somente leitura. `migrations:homologacao` aplica na branch `desenvolvimento-local` só
quando pedido explicitamente.

Os antigos arquivos `.env.baseline-clone.local` e `.env.baseline-vazio.local` e seus scripts
foram preservados somente como histórico local. Seus endpoints já não existem e eles não
participam mais de nenhum comando do `package.json`.

Nunca alterar migration antiga já aplicada. Correção de drift entra em migration nova.
Nunca esconder erro de schema com fallback silencioso: coluna ausente precisa aparecer, é o
sinal de que o ambiente saiu da cadeia ativa.
