# 📐 Regras do Projeto — Loja Virtual

> Documento vivo. Toda IA deve seguir estas regras **sem exceção**.

---

# 🤖 Regras de Comportamento da IA

1. Nunca enviar código sem explicar antes e aguardar aprovação

2. Após aprovação:

   * passo a passo
   * caminho completo do arquivo (`src/features/products/actions/create.ts`)
   * código comentado (explicando o “porquê”)

3. Aplicar práticas de engenharia sênior:

   * código limpo
   * separação de responsabilidades
   * escalabilidade

4. Interfaces sempre responsivas

5. Em caso de dúvida:

   * apresentar opções
   * aguardar decisão

---

# 🧠 Arquitetura do Projeto

* Modelo: **Feature-based (modular por domínio)**
* Next.js (App Router)

---

# 🧩 REGRA PRINCIPAL (CRÍTICA)

👉 Cada domínio vive em **um único lugar**
👉 Admin e Store são apenas **variações de interface dentro do domínio**

---

## 📁 Estrutura de Feature (PADRÃO)

```bash
src/features/<dominio>/
├── components/
│   ├── admin/              # UI do painel administrativo
│   └── store/              # UI da loja (cliente)
│
├── actions/                # escrita no banco (Server Actions)
├── queries/                # leitura de dados (server-only)
├── hooks/                  # client (TanStack Query, estado)
├── schemas/                # validação (Zod)
├── lib/                    # regra de negócio pura (sem React)
├── types/                  # tipos TypeScript
├── constants/              # valores fixos
└── index.ts                # barrel export
```

---

## 🧠 Regras de domínio

* Domínio (ex: categories, products) é único
* Admin = gestão (CRUD, dashboards)
* Store = exibição (cliente)

❌ Nunca duplicar domínio em outras pastas
❌ Nunca misturar lógica entre domínios

---

# 📁 Estrutura Global

```bash
src/
├── app/                    # rotas (Next.js)
├── features/               # domínios
├── db/                     # banco de dados
├── components/
│   ├── ui/                 # design system global
│   └── shared/             # componentes reutilizáveis
├── lib/                    # configurações globais
├── hooks/                  # hooks globais
├── types/                  # tipos globais
└── constants/              # constantes globais
```

---

# 🗄️ Banco de Dados (Drizzle ORM)

```bash
src/db/
├── connection.ts           # conexão com banco
├── schema.ts               # agrega todas tabelas + relations
└── tables/
    ├── <dominio>/
    │   ├── <tabela>.ts     # definição da tabela
    │   └── relacoes.ts    # relações entre tabelas
```

---

## 🧠 Regras do banco

* Banco é **global (source of truth)**
* Features **nunca definem tabela**
* Sempre usar `relations()` para relacionamentos
* Nunca fazer join manual sem tipagem

### 📌 Padrões obrigatórios

* Tabelas:

  * nome em **snake_case plural**
  * ex: `products`, `order_items`

* Campos obrigatórios:

  * `id`
  * `createdAt`
  * `updatedAt`

* Chaves estrangeiras:

  * sempre explícitas (`categoryId`, `userId`)

---

# ⚠️ Separação de responsabilidades (CRÍTICO)

* `actions/` → escrita (create, update, delete)
* `queries/` → leitura (get, list, search)
* `lib/` → lógica de negócio pura
* `hooks/` → client-side

❌ Nunca misturar responsabilidades
❌ Nunca lógica de negócio dentro de components

---

# ⚙️ Next.js (App Router)

* `app/` contém apenas:

  * `page.tsx`
  * `layout.tsx`
  * `loading.tsx`
  * `error.tsx`
  * `route.ts`

---

## 📌 Regras

* Mutações → Server Actions

* API Routes → apenas:

  * webhooks
  * integrações externas

* Server Components por padrão

* `'use client'` apenas quando necessário:

  * estado (useState)
  * eventos (onClick)
  * TanStack Query
  * libs client-only

---

# 🔍 SEO + IA (ALTÍSSIMA PRIORIDADE)

## Regras obrigatórias

1. Toda página pública deve usar:

* `generateMetadata`

2. URLs limpas e semânticas:

```
/categoria/nome-da-categoria
/produto/nome-do-produto
```

3. Conteúdo renderizado no servidor:

* SSR ou SSG
  ❌ evitar conteúdo crítico só no client

4. HTML semântico:

* 1 `<h1>` por página
* hierarquia correta (`h2`, `h3`)

5. Performance:

* imagens otimizadas
* evitar JS desnecessário
* lazy loading quando possível

6. Dados estruturados:

* JSON-LD (produtos, preços, avaliações)

---

## 🤖 SEO para IA

* conteúdo claro e direto
* títulos descritivos
* páginas com contexto (não só listagem)
* evitar textos genéricos
* nomes de produtos bem definidos

---

# 🎨 Tailwind CSS (NÍVEL PROFISSIONAL)

## Regras obrigatórias

1. Usar `prettier-plugin-tailwindcss`

2. Ordem das classes:
   layout → spacing → typography → colors → states

3. Dark mode sempre junto:

```html
text-zinc-700 dark:text-zinc-300
```

4. Evitar valores arbitrários:

```css
w-[123px] /* explicar motivo */
```

---

## 🚨 REGRA MAIS IMPORTANTE

👉 Nunca repetir classes grandes

❌ errado:

```tsx
<button className="px-4 py-2 bg-blue-500 text-white rounded-md ...">
```

✅ correto:

```tsx
<Button />
```

---

## 🎯 Design System (OBRIGATÓRIO)

```bash
src/components/ui/
├── Button.tsx
├── Input.tsx
├── Card.tsx
```

---

## 🧩 Variantes (CVA)

* usar `class-variance-authority`
* padronizar estilos
* evitar duplicação

---

## 📌 Tailwind NÃO substitui CSS

Usar CSS para:

* animações complexas
* scrollbar
* casos específicos

---

# 🔄 TanStack Query

* nunca usar `fetch` manual em client
* usar query keys padronizadas
* invalidar queries após mutation

---

# 🧠 Drizzle

* relations obrigatórias
* queries fora de components
* migrations automáticas (drizzle-kit)
* nunca editar migrations manualmente

---

# 🧩 Formulários

* usar:

  * react-hook-form
  * zod

* validação dupla:

  * client + server

❌ nunca usar useState para formulário

---

# 🔐 Segurança

* validar entrada com Zod
* validar sessão em todas actions
* nunca confiar no frontend
* variáveis sensíveis sem `NEXT_PUBLIC_`

---

# 🚀 Escalabilidade

* paginação desde início
* evitar hardcode
* componentes < 200 linhas
* seguir ordem:
  banco → types → actions → UI

---

# ❌ Proibições Absolutas

* lógica em `app/`
* páginas em `features/`
* duplicar domínio
* usar `services` genérico
* fetch manual em client
* usar `any`
* upload direto do cliente
* confiar no frontend para pagamento

---

# 🧭 Regra Final

👉 Código deve ser:

* escalável
* organizado
* reutilizável
* fácil de manter
