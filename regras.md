# 📐 Regras do Projeto — Loja Virtual

> Documento vivo. Toda IA deve seguir estas regras **sem exceção**.

---

# 🤖 Regras de Comportamento da IA

1. Antes de alterar algo grande, explique rapidamente o plano. Depois execute sem ficar pedindo aprovação a cada comando.

2. Após aprovação:

   * passo a passo
   * caminho completo de cada arquivo alterado ou criado, respeitando a arquitetura real do domínio e o padrão de organização existente no projeto
   * código sempre comentado, explicativo de forma que qualquer iniciante ler entenda

3. Ser e Aplicar as melhores práticas de engenheiro de software sênior e especialista em react nextjs:

   * código limpo
   * separação de responsabilidades
   * escalabilidade

4. Interfaces sempre responsivas para qualquer tamanho de telas

5. Priorizar sempre componentes, padrões e soluções já validadas e amplamente utilizadas pela comunidade antes de criar componentes customizados do zero.

Preferir reutilização de:

- componentes já existentes no projeto;
- componentes do shadcn/ui;
- blocos oficiais e exemplos recomendados;
- bibliotecas já adotadas pelo projeto;
- plugins e integrações consolidadas;
- padrões oficiais do Tailwind CSS;
- soluções maduras, testadas e mantidas pela comunidade.

Evitar reinventar componentes que já possuam implementação estável e amplamente validada.

Criar componentes customizados apenas quando não existir alternativa adequada ou quando houver necessidade específica do negócio.

Priorizar consistência visual, manutenção simples, velocidade de desenvolvimento, acessibilidade e experiência já validada por usuários reais.

6. Para novas funcionalidades administrativas, iniciar sempre pela experiência do usuário.

Primeiro criar wireframe ou frontend com dados mockados, usando o Design System atual e componentes já validados do projeto. Após aprovação visual e funcional, evoluir para integração com banco, actions, services e dados reais.

Evitar começar por migrations, services ou regras de backend antes de validar o fluxo da tela, especialmente em módulos complexos como fornecedores, importações, logística, promoções, produtos e marketplace.

7. Autonomia da IA / Codex

- Não parar para pedir permissão em tarefas técnicas comuns.
- Pode executar comandos de validação, testes, build, lint, typecheck e abrir/recarregar navegador headless.
- Pode investigar erros, consultar logs e ajustar arquivos do projeto sem perguntar antes.
- Só deve perguntar ao usuário quando:
  - envolver apagar dados reais;
  - mexer em pagamento, produção ou credenciais;
  - houver mais de uma decisão de negócio possível.
- Ao final, sempre validar com:
  - npm run typecheck ou npx tsc --noEmit
  - npm run lint, se existir
  - npm run build, se aplicável
  - teste manual/headless da página alterada, se necessário
- Não considerar tarefa concluída sem informar o que testou e o resultado.
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
│   └── subpasta/
│       ├── arquivo1.ts
│       ├── arquivo2.ts
│       ├── arquivo3.ts
│       ├── arquivo4.ts               
├── hooks/                  # client (TanStack Query, estado)
│   └── arquivo1.ts
│   ├── arquivo2.ts
│   ├── arquivo3.ts    
├── schemas/                # validação (Zod)
├── lib/                    # regra de negócio pura (sem React)
├── types/                  # tipos TypeScript
├── constants/              # valores fixos
└── index.ts                # barrel export
```
Regra prática (guarda isso)

👉 Até 3 arquivos → pode ficar direto
👉 Passou disso → cria subpasta por assunto
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
## Convenções de nomenclatura

- Usar nomes claros, descritivos e em português.
- Evitar termos genéricos ou técnicos sem necessidade.
- Não usar nomes em inglês para:
  - arquivos;
  - variáveis;
  - funções;
  - schemas;
  - componentes;
  - tipos;
  - actions;
  - queries;
  - tabelas;
  - enums.

Exemplos corretos:
- frete-externo.tsx
- pesoProduto
- alturaProduto
- classificacoesLogisticas
- buscarServicosEntrega

Evitar:
- shipping
- freight
- dimensions
- weight
- delivery
- externalShipping

Exceção:
- APIs externas;
- bibliotecas;
- nomes obrigatórios do framework;
- nomes oficiais de terceiros.


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

1.0 Ser um especialista em ux/ui designer e aplicar as melhores práticas.

1.1 Usar `prettier-plugin-tailwindcss`

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

## Migrations (OBRIGATÓRIO)

* Alterações de schema devem ser feitas nos arquivos Drizzle (`src/db/tables/**`)
* Nunca alterar tabelas diretamente no banco
* Nunca editar migrations manualmente após geradas
* Toda alteração estrutural deve gerar uma migration versionada

Fluxo padrão:

1. Alterar schema Drizzle
2. Gerar migration:

```bash
npx drizzle-kit generate
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
