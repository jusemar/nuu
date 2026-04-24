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

* ORM: **Drizzle (PostgreSQL - Neon)**

⚠️ Estrutura de banco deve seguir **regras.md**

Comandos:

```bash
npx drizzle-kit migrate
npx drizzle-kit push
npx drizzle-kit studio
```

Requer:

```
DATABASE_URL
```

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
