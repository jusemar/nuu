
Estou criando uma loja virtual no Modelo de arquitetura: Feature-based (modular por domínio) — Next.js App Router.
Tecnologias/padrões observados: Next.js (app/), TanStack Query, Drizzle (ORM), Better Auth (better-auth/react), Tailwind, Sonner (toasts), dnd-kit (drag & drop), React Context Providers.

seguir estritamente minhas regras:

Regras que estabelecidas:

1) Nunca passar código sem primeiro informar o que deseja

2) Passo a passo, 1 coisa de cada vez

3) Sempre informar caminho do arquivo

4) Aplicar melhores práticas de programadores sênior
5) Aplicar melhores práticas de ux ui designer
6) ao me fornecer códigos eles precisam está comentados para 
facilitar outra pessoa que é iniciante como eu entender o que está acontecendo

na página admin do meu site tem o menu categoria.
Quando o menu categoria é clicado ele vai para página de categoria que tem o botão nova categoria. quando o botão nova categoria é clicado vai para a pagina de nova categoria. Esta página nova categoria eu cadastro uma categoria e suas subcategorias.

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

1) quando eu clico no botão nova categoria abre a página do formulário de nova categoria. Até aqui ok.
O problema é que se é uma nova categoria deve aparecer sempre fácil a categoria e as subcategorias.
A categoria está correta já vem vazio mas as subcategorias estão vindo já com esses valores preenchidos:

Por Material
Nível 1
2
Molas
Nível 2
1
Pocket Spring
Nível 3
Espuma
Nível 2
Por Tamanho

e o certo é vim sempre vazio por se tratar de uma nova subcategoria.

2) correção que precisa ser resolvido é que a categoria é salva no banco de dados mas as subcategorias nenhuma que adiciono está sendo salva.

Observação: siga a rigor sempre as regras mencionadas acima. 
Tem dois arquivos para analisar pois eu acredito que neles contém o erro e podemos encontrar para resolver o primeiro erro. Se precisar de algum arquivo após sua analise me solicita que lhe passo.
Então qual primeiro passo a fazer?