
Estou criando uma loja virtual no Modelo de arquitetura: Feature-based (modular por domínio) — Next.js App Router.
Tecnologias/padrões observados: Next.js (app/), TanStack Query, Drizzle (ORM), Better Auth (better-auth/react), Tailwind, Sonner (toasts), dnd-kit (drag & drop), React Context Providers.

você deve seguir estritamente minhas regras:

Regras que estabelecidas:

1) Nunca passar código sem primeiro informar sua opinião para eu primeiro aprovar.

2) Depois que foi aprovado por mim passe as informações Passo a passo, 1 coisa de cada vez.

3) Sempre que passar o código informar caminho do arquivo completo do arqquivo

4) Aplicar melhores práticas de programadores sênior em next

5) Aplicar melhores práticas de ux ui designer

6) Só me forneça códigos comentados de forma que outra pessoa que é iniciante possa entender fácil.

Na página principal do admin do site tem o menu categoria.
Quando estou na página categoria é exibido a lista de categoria na tabela. 
Está tabela criada é um componente shadcn que estou usando.

O que eu desejo fazer agora é exibir as subcategorias da categoria. Adicionar um icon de seta. Quando clicar nesta seta  será exibido abaixo os nomes das subcategorias e seus níveis.

Entendendo o fluxo:

1. Estrutura que eu tenho na página de nova categoria que tem o formulário:

exemplo: eu insiro esse dado no formulário

Produtos Naturais (nível 0 - categoria principal)
├─ SEMENTE DE GIRASSOL (nível 1 - subcategoria)
│ └─ Embalagem 1kg (nível 2 - sub-subcategoria)
├─ PSYLLIUM HUSK (nível 1)
└─ Mix Castanhas (nível 1)

2. O que deveria salvar no banco drizzle:

-- Resultado esperado no banco:
id | name                  | parent_id                           | level
---|-----------------------|-------------------------------------|------
A  | Produtos Naturais     | NULL                                | 0
B  | SEMENTE DE GIRASSOL   | A (id da Produtos Naturais)         | 1
C  | Embalagem 1kg         | B (id da SEMENTE DE GIRASSOL)       | 2
D  | PSYLLIUM HUSK         | A (id da Produtos Naturais)         | 1
E  | Mix Castanhas         | A (id da Produtos Naturais)         | 1


Como funciona a hierarquia:

Categorias principais (nível 0): parentId é NULL, level é 0

Subcategorias (nível 1): parentId aponta para categoria principal, level é 1

Sub-subcategorias (nível 2): parentId aponta para subcategoria, level é 2

Exemplo no banco:
ID  | name         | parentId | level | orderIndex
----|--------------|----------|-------|-----------
1   | Eletrônicos  | NULL     | 0     | 1
2   | Celulares    | 1        | 1     | 1
3   | Smartphones  | 2        | 2     | 1
4   | Tablets      | 2        | 2     | 2
5   | Roupas       | NULL     | 0     | 2
6   | Masculino    | 5        | 1     | 1
7   | Feminino     | 5        | 1     | 2


A minha estrutura atual de arquivos relacionado a categoria: 

src/features/admin/categories/
├── components/
│   └── (vazio)
├── form/
│   └── CategoryForm/
│       ├── BasicInfoCard.tsx
│       ├── DropZone.tsx
│       ├── SidebarCards.tsx
│       ├── SortableSubcategoryNode.tsx
│       ├── SubcategoriesCard.tsx
│       ├── SubcategoryNode.tsx
│       ├── index.tsx
│       ├── hooks/
│       │   ├── useCategoryBreadcrumb.ts
│       │   ├── useSlugGenerator.ts
│       │   └── useSubcategoryDnD.ts
│       └── utils/
│           ├── createChildSubcategory.ts
│           ├── deleteSubcategory.ts
│           ├── reorderSubcategories.ts
│           ├── subcategory.helpers.ts
│           └── updateSubcategory.ts
├── hooks/
│   ├── query-keys.ts
│   ├── useCategoryDetail.ts
│   ├── useCategoryList.ts
│   ├── useCreateCategory.ts
│   └── useUpdateCategory.ts
├── services/
│   └── categoryService.ts
└── types/
    └── index.ts

observação: eu usava uma outra estrura sem ser essa acima. Estou fazendo uma migração para essa nova arquitetura informada no ínicio da conversa que é :  Feature-based (modular por domínio).

Estou com 2 problemas para serem resolvidos.

1) Está funcionando hoje usando a arquitetura antiga sem a subcategoria exibindo. Precisa criar migrando para nova 
arquitetura.


2) quero que mantenha as funcionalidades que já existem e adicionar o recurso de exibir as subcategorias e o novo designer com boas práticas de ux ui melhorar o visual. Vou dar um exemplo de um código que eu peguei de um modelo de visual que gostei para inspira-lo.

3) em cada linha adicione uma coluna de ação com icon de um lapís indicando que é para alterar.

Observação: siga a rigor sempre as regras mencionadas acima. 
O arquivo e caminho antigo é esse: src/app/admin/categories/page.tsx e o arquivo está em anexo.
Quando você precisar de mais arquivos da arquitetura do antigo para analisar.

Adicionei três arquivos para analisar sendo dois deles da tabela categoria que exibi as subcategorias Se precisar de algum arquivo após sua analise me solicita que eu lhe passo.
Então qual primeiro passo a fazer?