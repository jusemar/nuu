quando altero ou cria tabela no drizzle preciso executar esse comando
acesso ao neon console : http://local.drizzle.studio
npx drizzle-kit push 
npx drizzle-kit studio


Hook:

Cliente ("use client")

Gerencia estado no frontend

Ex: useCategories, useState

Server Action:

Servidor (sem "use client")

Executa no servidor (banco, arquivos)

Ex: createCategory, updateCategory

Resumo: Hook = frontend, Server Action = backend 🎯


Estrutura completa do domínio (como você pediu)
src/features/shipping/
├── components/
│   ├── admin/
│   │   ├── ShippingSettings.tsx
│   │   ├── FreteProprioForm.tsx
│   │   ├── RetiradaLocalForm.tsx
│   │   └── TransportadoraForm.tsx
│   │
│   └── store/
│       ├── ShippingOptions.tsx
│       ├── ShippingCalculator.tsx
│       └── PickupInfo.tsx
│
├── actions/
│   ├── createFreteProprio.ts
│   ├── updateFreteProprio.ts
│   ├── createRetirada.ts
│   ├── updateRetirada.ts
│   ├── createTransportadora.ts
│   └── index.ts
│
├── queries/
│   ├── getShippingOptions.ts
│   ├── getFreteProprio.ts
│   ├── getRetirada.ts
│   └── index.ts
│
├── hooks/
│   ├── useShipping.ts
│   ├── useShippingCalculator.ts
│   └── query-keys.ts
│
├── schemas/
│   ├── freteProprio.schema.ts
│   ├── retirada.schema.ts
│   ├── transportadora.schema.ts
│   └── index.ts
│
├── lib/
│   ├── calculateShipping.ts
│   ├── freteProprio.ts
│   ├── retirada.ts
│   ├── transportadora.ts
│   └── helpers.ts
│
├── types/
│   ├── shipping.types.ts
│   └── index.ts
│
├── constants/
│   ├── shipping.constants.ts
│   └── index.ts
│
└── index.ts
🧠 Como saber se é um domínio

Use essa regra simples:

👉 Se você consegue responder:

“isso é uma área do sistema com várias regras próprias?”

✔️ então é domínio

No seu caso

✔️ shipping (logística) → domínio
❌ freteProprio → NÃO é domínio
❌ retirada → NÃO é domínio

👉 eles são sub-regras do domínio
