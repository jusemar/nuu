quando altero ou cria tabela no drizzle preciso executar esse comando
acesso ao neon console : http://local.drizzle.studio
npx drizzle-kit push 
npx drizzle-kit studio

Commit atual (backup): Rode npx drizzle-kit generate agora para salvar estado atual
Aplicar schemas novos: Depois rode npx drizzle-kit push das novas tabelas
npx drizzle-kit migrate --rollback  # Volta última migration


Hook:

Cliente ("use client")

Gerencia estado no frontend

Ex: useCategories, useState

Server Action:

Servidor (sem "use client")

Executa no servidor (banco, arquivos)

Ex: createCategory, updateCategory

Resumo: Hook = frontend, Server Action = backend 🎯


Regra do Next.js App Router:
Toda rota acessível via URL deve estar dentro da pasta src/app/. A pasta src/features/ é para componentes, hooks, utilitários, lógica de negócio — não para páginas.