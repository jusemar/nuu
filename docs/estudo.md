quando altero ou cria tabela no drizzle preciso executar esse comando
acesso ao neon console : http://local.drizzle.studio
npx drizzle-kit push 
npx drizzle-kit studio

Commit atual (backup): Rode npx drizzle-kit generate agora para salvar estado atual
Aplicar schemas novos: Depois rode npx drizzle-kit push das novas tabelas
npx drizzle-kit migrate --rollback  # Volta última migration
Regra do Next.js App Router:
Toda rota acessível via URL deve estar dentro da pasta src/app/. A pasta src/features/ é para componentes, hooks, utilitários, lógica de negócio — não para páginas.


Hook:

Cliente ("use client")

Gerencia estado no frontend

Ex: useCategories, useState

Server Action:

Servidor (sem "use client")

Executa no servidor (banco, arquivos)

Ex: createCategory, updateCategory

Resumo: Hook = frontend, Server Action = backend 🎯


🧠 O ponto principal
👉 No seu caso (Drizzle + Next App Router):
✔️ Banco (DB) = sempre no server

O padrão correto (pra sua arquitetura) 🥇 PRIORIDADE
👉 B — Server Component (melhor padrão base)
✔️ mais simples
✔️ mais performático
✔️ menos erro
✔️ ideal pra SEO
// page.tsx (server)
const data = await buscarDados();


Quando usar TanStack Query 👉 Só quando precisar:
atualização em tempo real
filtros dinâmicos
interação pesada no client

Server Actions 👉 Use para:
✔️ criar
✔️ atualizar
✔️ deletar

Resumo simples 👉 Use assim:
Leitura (GET) → Server Component (page.tsx) ✔️
Mutação (POST/PUT/DELETE) → Server Actions ✔️
Client interativo → TanStack Query (quando precisar) ✔️
🔥 Regra de ouro (guarda isso)
👉 Se usa Drizzle → começa sempre no server