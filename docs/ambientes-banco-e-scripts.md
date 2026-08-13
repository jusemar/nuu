# Ambientes de banco e execução de scripts

Documento operacional. Vale para qualquer script que toque o banco.

**Regra única:** desenvolvimento local nunca usa o banco principal. Produção só recebe
escrita por comando dedicado, com autorização explícita.

---

## 1. Os ambientes

| Ambiente          | Branch Neon                                                | Endpoint                  | Para que serve                                                             |
| ----------------- | ---------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------- |
| `desenvolvimento` | `desenvolvimento-local`                                    | `ep-quiet-bar-acb7yly2`   | Tudo que se roda na máquina: `npm run dev`, seeds, importações, manutenção |
| temporário        | criado automaticamente a partir de `desenvolvimento-local` | criado automaticamente    | Validar clone e cadeia completa; expira e é removido ao final              |
| `producao`        | `production`                                               | `ep-proud-bonus-acy2bafx` | Só a aplicação publicada. Nenhum script local escreve aqui                 |

---

## 2. Qual arquivo de ambiente cada comando usa

| Comando                                      | Arquivo lido                                                                              | Destino                                               |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `npm run dev` / `build` / `start`            | `.env.local` (precedência do Next), completado por `.env`                                 | desenvolvimento                                       |
| `npm run seed:*`, `import:*`, `manutencao:*` | `.env.desenvolvimento.local` para o banco; `.env.local` + `.env` para as demais variáveis | desenvolvimento                                       |
| `npm run migrations:pre-validar`             | `.env.neon.local` e `.env.desenvolvimento.local`                                          | somente leitura                                       |
| `npm run migrations:validar-apenas`          | `.env.neon.local` e `.env.desenvolvimento.local`                                          | branch temporária, sem aplicar em desenvolvimento     |
| `npm run migrations:validar`                 | `.env.neon.local` e `.env.desenvolvimento.local`                                          | branch temporária e, após validações, desenvolvimento |
| `npx drizzle-kit generate` / `migrate`       | `DATABASE_URL_MIGRACOES` informada na própria linha de comando                            | o que for informado                                   |

`.env` existe **apenas** para guardar a URL de produção documentada. Nenhum comando local o
usa como destino.

Todos os `.env*` são ignorados pelo git. Nenhuma credencial é versionada.

---

## 3. Comandos seguros

```bash
npm run dev                            # aplicação local, banco de desenvolvimento
npm run seed:logistica-dados-iniciais  # seed idempotente
npm run seed:own-delivery-regions
npm run seed:admin-teste
npm run import:ceps
npm run manutencao:medidas-produtos
npm run migrations:pre-validar       # não cria recursos
npm run migrations:validar-apenas    # testa sem aplicar em desenvolvimento
npm run migrations:validar           # fluxo completo e único
```

Todos imprimem, antes de qualquer escrita, um quadro com o destino:

```
┌──────────────────────────────────────────────────────────
│ DESTINO DO BANCO: DESENVOLVIMENTO
│ endpoint : ep-quiet-bar-acb7yly2
│ branch   : br-frosty-sea-acjpjuxk
│ host     : ep-quiet-bar-acb7yly2.sa-east-1.aws.neon.tech
└──────────────────────────────────────────────────────────
```

**Como identificar o banco alvo visualmente:** leia a linha `endpoint`. Se aparecer
`ep-proud-bonus-acy2bafx`, é PRODUÇÃO — interrompa. Em operação normal esse quadro nunca
mostra produção, porque a guarda encerra antes de imprimir.

---

## 4. Comandos proibidos

```bash
npx tsx scripts/seed-dados-iniciais-logistica.ts     # sem lançador: bloqueado
npx tsx scripts/import-shipping-zip-addresses.ts     # idem
npx drizzle-kit migrate                              # sem DATABASE_URL_MIGRACOES explícita
```

Executar um script direto é bloqueado em duas camadas independentes — ver seção 5.

Nunca aponte `.env.local` ou `.env.desenvolvimento.local` para `ep-proud-bonus-acy2bafx`.
A guarda recusa, mas a intenção já está errada.

---

## 5. Como a proteção funciona

Duas camadas independentes. Furar uma não basta.

### Camada 1 — `scripts/lib/guarda-banco-local.ts`

Aplicada pelo lançador `scripts/lib/executar-script-local.ts`, por onde passam todos os
comandos locais de banco. Antes de abrir qualquer conexão:

1. exige `AMBIENTE_BANCO` explícito (sem ela, nada roda);
2. lê a URL do arquivo daquele ambiente — nunca de `.env`;
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

## 7. Ordem obrigatória para uma migration nova

Use `npm run migrations:validar`. O comando executa, sem intervenção manual:

1. confirmação da API, projeto, branch, endpoint, banco e usuário de desenvolvimento;
2. criação de uma branch temporária única, com nome exclusivo e expiração;
3. aplicação das pendências sobre o banco `neondb` clonado;
4. criação de outro banco vazio na mesma branch e aplicação da cadeia desde `0000`;
5. validação do journal e da estrutura nos dois bancos;
6. reconfirmação do desenvolvimento e aplicação somente se todos os testes passaram;
7. exclusão apenas do ID da branch criada pela execução.

Em falha anterior ao passo 6, desenvolvimento permanece intacto. Produção não é usada como
conexão PostgreSQL pelo fluxo. Para testar sem aplicar, use
`npm run migrations:validar-apenas`.

Os antigos arquivos `.env.baseline-clone.local` e `.env.baseline-vazio.local` e seus scripts
foram preservados somente como histórico local. Seus endpoints já não existem e eles não
participam mais de nenhum comando do `package.json`.

Produção continua sendo uma tarefa futura, com auditoria e aprovação explícitas.

Nunca alterar migration antiga já aplicada. Correção de drift entra em migration nova.
Nunca esconder erro de schema com fallback silencioso: coluna ausente precisa aparecer, é o
sinal de que o ambiente saiu da cadeia ativa.
