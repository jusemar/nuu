# AGENTS.md

# ⚠️ REGRA PRINCIPAL (LEIA PRIMEIRO)

Este projeto possui um padrão arquitetural oficial definido em:

👉 **`regras.md`**

## 🔥 PRIORIDADE ABSOLUTA

* `regras.md` é a **única fonte de verdade**
* Este arquivo (`AGENTS.md`) é apenas **auxiliar**
* Em caso de conflito → **seguir sempre `regras.md`**

---

## ❌ PROIBIDO

* Usar padrões antigos deste arquivo como referência arquitetural
* Criar código fora do padrão definido em `regras.md`
* Criar estruturas como:

  * `src/actions/` (fora de features)
  * `src/shared/ui/` como principal estrutura
* Tomar decisões arquiteturais sem consultar `regras.md`

---

## ✅ OBRIGATÓRIO

* Sempre ler `regras.md` antes de criar qualquer código
* Seguir arquitetura **Feature-based por domínio**
* Seguir separação obrigatória:

  * `actions` → escrita
  * `queries` → leitura
  * `lib` → regra de negócio
  * `components` → UI

---

# ⚙️ Developer Commands

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run lint    # Run ESLint
npm run start   # Start production server
```

Typecheck manual:

```bash
npx tsc --noEmit
```

---

# 🗄️ Database

* ORM: **Drizzle (PostgreSQL)** — local em Docker no desenvolvimento; Neon em produção

### 🐘 Ambiente de banco (LEIA ANTES DE TOCAR NO BANCO)

- **Padrão = PostgreSQL LOCAL persistente, que JÁ EXISTE:** container `nooo-postgres-local`,
  volume `nooo-postgres-local-dados`, `127.0.0.1:55432/nooo_desenvolvimento` (PostgreSQL 17 + pgvector).
  **Não crie outro PostgreSQL/container.** Use `npm run db:local:subir` / `db:local:status`.
- `npm run dev` = local. `npm run dev:neon` = Neon **explícito** (só quando o usuário pedir).
- `npm run migrations:local` = local. Testes/ensaios de migration = descartável em Docker
  (`migrations:validar-apenas`, `migrations:validar`, `testes:integracao:logistica`).
- `npm run migrations:producao` = Neon produção, uma vez, no fim, com autorização.
- **Nunca usar Neon para testes/ensaios e nunca criar branch Neon** (só existem `production` e `desenvolvimento-local`).
- Detalhes: `docs/ambientes-banco-e-scripts.md`.



⚠️ Estrutura de banco deve seguir **regras.md**

Comandos:

```bash
npm run migrations:local          # aplica no PostgreSQL local persistente
npm run migrations:validar-apenas # valida em PostgreSQL descartável
npx drizzle-kit generate          # com DATABASE_URL_MIGRACOES descartável na linha de comando
```

Nunca `drizzle-kit push`/`migrate` contra a Neon.

---

# ⚠️ Arquitetura (RESUMO SIMPLES)

👉 Estrutura correta:

```
src/
├── app/          # rotas
├── features/     # domínios (fonte principal)
├── db/           # banco
```

👉 Regra:

* `app/` → apenas rotas
* `features/` → lógica + UI
* `db/` → banco global

⚠️ Estrutura detalhada → ver `regras.md`

---

# 🔄 Padrões Técnicos

* Forms → React Hook Form + Zod
* Queries client → TanStack Query
* Mutações → Server Actions
* Query keys → sempre centralizadas

---

# 🎨 Styling

* Tailwind CSS
* Preferir componentes reutilizáveis
* Evitar duplicação de classes

---

# 🧩 UI

* Preferir shadcn/ui
* Customizar via wrapper (não alterar direto)

---

# 🌐 Imagens

Domínios configurados em `next.config.ts`

---

# 🔐 Environment Variables

```
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_APP_URL
```

---

# 🧭 REGRA FINAL

👉 Este arquivo NÃO define arquitetura

👉 Sempre seguir:

✔️ **regras.md**
