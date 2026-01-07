Server Action (create.ts)
✅ Validação dos dados (futuro com Zod)

✅ Operações no banco (Drizzle + Neon)

✅ Revalidação de cache

✅ Segurança (autenticação/autorização)

❌ NUNCA estado da UI

❌ NUNCA hooks React

Hook (useCreateCategory)
✅ Gerenciar estado de loading/error

✅ Integração com Toast (UI feedback)

✅ Chamar a Server Action

✅ Navegação após sucesso

❌ NUNCA operações diretas no banco

Componente (category-form.tsx)
✅ Renderizar UI

✅ Coletar dados do usuário

✅ Chamar o hook

❌ NUNCA lógica de negócio

Fluxo ideal:
Usuário preenche → Componente chama Hook → Hook chama Server Action → Banco


hooks/ - lógica reutilizável com estado (React hooks)

lib/ - funções puras sem estado (utils, formatters)

helpers/ - mesmo que lib (funções auxiliares)

providers/ - Context API providers

O useSlugGenerator está no lugar certo - em hooks/! ✅

src/db/
├── schema/
│   ├── index.ts (exporta tudo)
│   ├── categories.ts
│   ├── products.ts
│   ├── users.ts
│   ├── orders.ts
│   └── ... (cada entidade separada)
├── index.ts (config do db)
└── types.ts (tipos TypeScript)


Seu Modelo é: Feature-based (modular por domínio) — Next.js App Router.
Tecnologias/padrões observados: Next.js (app/), TanStack Query, Drizzle (ORM), Better Auth (better-auth/react), Tailwind, Sonner (toasts), dnd-kit (drag & drop), React Context Providers.
nuu/
├── src/
│   ├── app/
│   │   ├── authentication/
│   │   │   └── components/
│   │   │       ├── sign-in-form.tsx
│   │   │       └── sign-up-form.tsx
│   │   ├── admin/
│   │   │   ├── categories/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── cart/
│   │   │   ├── confirmation/
│   │   │   │   └── components/finish-order-button.tsx
│   │   │   ├── identification/
│   │   │   │   └── components/addresses.tsx
│   │   │   └── components/cart-summary.tsx
│   │   ├── category/
│   │   │   └── [slug]/page.tsx
│   │   ├── product-variant/
│   │   │   └── [slug]/page.tsx (with components: add-to-cart-button.tsx, product-actions.tsx, variant-selector.tsx)
│   │   ├── checkout/
│   │   │   └── success/page.tsx
│   │   ├── my-orders/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...all]/route.ts
│   │   │   ├── admin/categories/route.ts
│   │   │   └── stripe/webhook/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── admin/ (header, sidebar, toolbar, category-form)
│   │   ├── common/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── cart.tsx
│   │   │   ├── categories-menu/ (index.tsx, mobile-menu.tsx, wrapper.tsx)
│   │   │   └── many product/category UI components
│   │   └── ui/
│   │       ├── shadcn-io/navbar-08/ (index.tsx, logo.tsx, desktop-navigation.tsx, mobile-menu.tsx, notification-menu.tsx)
│   │       ├── data-table.tsx
│   │       ├── popover.tsx
│   │       ├── table.tsx
│   │       ├── input.tsx, button.tsx, toast/sonner.tsx, scroll-area.tsx, etc.
│   ├── data/
│   │   ├── categories/get.ts
│   │   └── products/get.ts
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   ├── seed.ts
│   │   ├── types.ts
│   │   └── table/
│   │       ├── categories.ts
│   │       └── products.ts
│   ├── actions/
│   │   ├── admin/categories/create.ts
│   │   ├── admin/categories/delete.ts
│   │   ├── add-cart-product/
│   │   ├── remove-cart-product/
│   │   └── create-checkout-session/
│   ├── hooks/
│   │   ├── queries/ (use-cart.ts, use-user-addresses.ts)
│   │   ├── mutations/ (use-create-shipping-address.ts, use-finish-order.ts, admin/mutations/categories/useDeleteCategory.ts)
│   │   ├── use-auth.ts
│   │   ├── use-mobile.ts
│   │   └── forms/use-category-form.ts
│   ├── helpers/ (money.ts)
│   ├── lib/
│   │   ├── auth-client.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   ├── providers/
│   │   ├── react-query.tsx
│   │   ├── categories-provider.tsx
│   │   └── categories-provider-client.tsx
│   └── app/test/... (example/test pages with data-table draggable)
├── public/ (images, svgs, banners)
├── drizzle.config.ts
├── drizzle/ (migrations/meta)
├── package.json
├── package-lock.json
├── tsconfig.json
├── postcss.config.mjs
├── .prettierrc.json
├── .env
├── README.md
└── estrutura.md




Subcategorias (em tela separada):

text
/admin/categories/[id]/subcategories
Gerenciar hierarquia visualmente

Arrastar e soltar para ordenar

Cada subcategoria pode ter seu próprio SEO

3. Tags (em outra aba/relacionamento):

Sistema de tags global na loja

Associar tags à categoria

Auto-complete com tags existentes

💡 Sugestão de Evolução:
Fase 1 (AGORA): Cadastro básico de categoria ✅
Fase 2: Tela de subcategorias com drag-and-drop
Fase 3: Sistema de tags global
Fase 4: Associação categoria-tags



useInfiniteQuery + fetchNextPage + pushState.

Porque: useInfiniteQuery já tem fetchNextPage pronto, pushState você adiciona. Sem pageParam manual.

 
ordenação na pagina home os grid de produtos.
Mais vendidos
Lançamentos
Promoções (discount %)
Relevância (score = views + sales)

Exibir produtos no grid:
Profissionais UX/UI usam:
Desktop grande (≥1280px): 5-6 colunas
Laptop (1024px): 4 colunas
Tablet (768px): 3 colunas
Mobile: 2 colunas
Recomendação prática:
grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6