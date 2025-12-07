usar isso Feature-Sliced + Derived State com : Next.js App Router + TanStack Query + Zustand 
Estamos usando Feature-Sliced Design com Next.js App Router.

Cada funcionalidade fica isolada em /features (product, cart, order, auth, etc.)
Server Actions para todas as mutations internas (criar, editar, deletar produtos, checkout, etc.)
TanStack Query para busca, cache automático e sincronização com o servidor
Route Handlers somente quando precisamos de APIs públicas ou integração third-party
Derived State no topo dos componentes para cálculos e filtros
Zustand apenas para estado global do cliente quando realmente necessário (ex: tema, carrinho rápido)

Dentro de cada feature temos:
actions/ → Server Actions
api/ → hooks do TanStack Query (queries + mutations)
components/ → UI
lib/ → utils, normalizers, formatters
types/ → interfaces e tipos”



src/
├── features/
│   └── product/
│       ├── api/
│       │   ├── queries/               # TanStack Query hooks (GET)
│       │   └── mutations/             # TanStack Query hooks (POST/PUT/DELETE)
│       ├── actions/                   # **SERVER ACTIONS** (mutations)
│       │   ├── update-product.action.ts
│       │   └── create-product.action.ts
│       ├── components/
│       ├── lib/
│       └── types/
│
└── app/
    ├── admin/products/[id]/
    │   └── page.tsx                   # Server Component com Server Actions
    └── api/
        └── products/                  # **ROUTE HANDLERS** (apenas públicos/third-party)
            └── [id]/
                └── route.ts           # API pública se necessário


src/
├── app/                  # Next.js App Router: rotas da LOJA
│   ├── produtos/
│   │   └── page.tsx      # Importa de features/product-card
│   └── layout.tsx
│
├── admin/                # Next.js App Router: rotas do ADMIN (separado)
│   ├── produtos/
│   │   └── page.tsx      # Reusa features/product-card se for compartilhado
│   └── layout.tsx
│
├── features/             # FSD: Features específicas (slices isolados)
│   ├── product-card/     # Sua feature atual
│   │   ├── components/
│   │   │   └── ProductCard.tsx  # Dumb component
│   │   ├── hooks/
│   │   │   └── use-derived-product.ts  # Derived state + TanStack Query
│   │   ├── types/
│   │   │   └── product-card.types.ts
│   │   └── index.ts      # Exporta tudo
│   ├── cart/             # Outra feature (ex: para loja)
│   │   ├── components/Cart.tsx
│   │   └── hooks/useCart.ts  # Zustand + Query
│   └── ...               # Mais features
│
├── entities/             # FSD: Modelos de domínio (ex: Product entity)
│   └── product/
│       ├── model.ts      # Tipos base
│       └── lib/          # Validações
│
├── shared/               # FSD: Coisas globais/reutilizáveis
│   ├── ui/               # Botões, modais (shadcn/ui)
│   ├── lib/              # Utils, Zustand stores
│   └── api/              # TanStack Query clients
│
└── types/                # Tipos globais
    └── global.ts