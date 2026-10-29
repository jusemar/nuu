# Representantes de fornecedores — Etapa 2

> Registro histórico da fundação. A integração posterior, a restrição de funções combinadas e a decisão de somente leitura estão documentadas na [Etapa 3](representantes-fornecedores-etapa-3.md); os limites descritos abaixo retratam o fechamento da Etapa 2.

Implementação da fundação em 27/10/2026. A identidade é a do Better Auth; as capacidades são as do RBAC já existente. O catálogo permanece comercialmente da Nooo. Não há proprietário novo em `product`, marketplace, interface de representante ou integração das actions legadas de produto com este módulo.

## Modelo e autorização

| Tabela nova | Finalidade | Restrições |
| --- | --- | --- |
| `representantes_fornecedores` | Vínculo entre `user` e `fornecedores` | Par usuário/fornecedor único; vários vínculos por usuário e vários usuários por fornecedor; `ativo=false` por padrão |
| `autorizacoes_produtos_representantes` | Liberação de um produto para um vínculo individual | Par vínculo/produto único; `ativa=false` por padrão |

As duas tabelas têm UUID, `createdAt`, `updatedAt`, criador e último responsável pela alteração, ambos referenciando `user`. As FKs usam `RESTRICT`; os índices cobrem os pares únicos, fornecedor/atividade e produto. As relações Drizzle estão declaradas junto às tabelas.

A granularidade é deliberadamente individual: a liberação para Ana no fornecedor A não libera Bruno no fornecedor A, nem Ana no fornecedor B. O fornecedor da autorização é determinado pelo vínculo referenciado, evitando duas colunas de fornecedor que possam divergir. Uma associação comercial em `fornecedor_produto_vinculos` nunca é convertida, copiada ou consultada como autorização. A liberação do gestor é independente da associação comercial; criar uma não cria a outra.

O preset `representante_fornecedor` contém somente:

- `representantes_produtos.visualizar`;
- `representantes_produtos.administrar`.

Essas chaves pertencem ao catálogo RBAC existente. Nenhuma delas satisfaz `produtos.visualizar`, `produtos.administrar`, `produtos.publicar`, categorias, importações, precificação ou gestão de usuários. Não há segundo autenticador ou segundo resolvedor de capacidades.

`obterContextoRepresentante()` resolve a sessão pelo serviço administrativo atual e consulta os vínculos do usuário autenticado. `exigirAcessoProdutoRepresentante(operacao, entrada)` valida os IDs, busca a autorização ligada ao mesmo usuário/fornecedor/produto e aplica a política pura. A operação deve ser fixada pela futura action no servidor; a entrada aceita somente `fornecedorId` e `produtoId`.

Para o representante, o acesso exige simultaneamente: identidade e vínculo administrativo ativos; capacidade ativa no RBAC, respeitando negações; vínculo de representação ativo; fornecedor ativo; autorização individual ativa para o produto pedido. Falha de consulta não vira autorização. Cada chamada consulta o estado atual, sem cache de autorização. IDs inexistentes, alheios e revogados recebem o mesmo erro de acesso.

O gestor principal preserva a política administrativa global e não precisa de vínculo de representação ou liberação individual. A chave global precisa continuar ativa no catálogo. Esse guard não substitui a validação de existência ou de negócio do produto.

## Gestão da fundação

As actions `salvarVinculoRepresentante` e `salvarAutorizacaoProdutoRepresentante` permitem ativar/revogar registros. Nesta etapa somente o gestor principal, com `administradores.administrar`, pode chamá-las. Não há UI nova para essas actions. Elas validam a entrada com Zod, derivam o ator da sessão e gravam a alteração e a auditoria administrativa na mesma transação. O criador e a data original são preservados em atualizações.

Criar um vínculo não cria usuário, administrador, associação de função ou override RBAC. Criar uma autorização não modifica o produto nem a associação comercial. Revogar não exclui usuário ou produto. Reativar um vínculo torna novamente elegíveis suas liberações individuais ainda ativas; para retirar definitivamente um produto, revogue também sua liberação.

O comando `npm run representantes:registrar-funcao` registra explicitamente o modelo de função e duas capacidades no banco local. É aditivo e idempotente, não associa pessoas a funções e não altera as definições anteriores. Recusa função com capacidades inesperadas e não reativa permissões desativadas. Não foi executado o sincronizador geral de presets.

## Migration e ambiente

A migration `0058_representantes_fornecedores.sql` foi gerada pelo Drizzle a partir do schema. Ela cria somente duas tabelas, oito FKs e quatro índices, sem DML, backfill ou alteração de colunas existentes. O snapshot e o journal foram gerados pela ferramenta; nenhuma migration anterior foi editada.

O validador do projeto estava ancorado em 0056, embora 0057 já existisse e estivesse aplicada localmente. A âncora passou a 0058. Uma validação adicional compara 0057 → 0058 e rejeita alterações em qualquer tabela ou objeto anterior.

Destino aplicado: container `nooo-postgres-local`, PostgreSQL 17, `127.0.0.1:55432/nooo_desenvolvimento`, identidade `cluster_name=nooo-postgres-local`. A identidade foi confirmada antes da escrita; `npm run migrations:local` passou de 58/59 para 59/59. O registro do modelo RBAC ocorreu no mesmo destino pelo lançador local protegido. Nenhum banco remoto foi consultado ou alterado.

## Preservação comprovada

Foram comparados contagens e hashes de todas as linhas de 20 tabelas, antes e depois da aplicação local: `user`, `session`, `account`, `administradores`, `administradores_funcoes`, `administradores_permissoes`, `fornecedores`, `fornecedor_produto_vinculos`, `product`, `product_variant`, `product_pricing`, `product_gallery_images`, `product_image`, `product_variant_image`, `product_attribute`, `category`, `category_faq`, `marca`, `checkout_pedidos` e `checkout_pedido_itens`. Os retratos foram idênticos.

Também foi verificado que todas as linhas anteriores de `funcoes_administrativas`, `permissoes_administrativas` e `funcoes_permissoes` foram preservadas; só as definições novas foram acrescentadas. Permanecem 149 produtos, 8 fornecedores e 124 vínculos comerciais. Nenhum usuário real recebeu o perfil ou uma liberação de produto. Os retratos temporários contêm somente hashes/contagens, não dados pessoais.

## Reversão documentada — não executada

1. Interromper o uso das novas actions e retirar o código consumidor, se futuramente houver. Um rollback somente do código pode manter as tabelas aditivas no banco sem afetar o catálogo antigo.
2. Antes de qualquer reversão física, exportar e validar cópia das duas tabelas novas e dos registros de auditoria relacionados. Se houver vínculos/liberações reais, obter autorização explícita para remover essas estruturas. A rotina não deve excluir usuários, fornecedores, produtos ou associações comerciais.
3. Para desativação funcional, revogar as liberações/vínculos pelas actions do gestor e retirar apenas as concessões de representante explicitamente identificadas. Não remover ou alterar permissões globais preexistentes. Nunca atribuir permissões globais como compensação.
4. Se a reversão física for autorizada, retirar exclusivamente as duas definições e relações do schema e gerar uma **nova migration compensatória** com Drizzle. Revisar que ela remove primeiro `autorizacoes_produtos_representantes` e depois `representantes_fornecedores`, sem `CASCADE` sobre objetos legados. Não editar 0058, seu snapshot ou o histórico aplicado.
5. Ensaiar a compensatória em PostgreSQL descartável, verificar integridade e preservação do catálogo, atualizar a âncora revisada e aplicar somente ao destino confirmado. O procedimento de produção exige autorização própria e não faz parte desta entrega.
6. As definições RBAC podem permanecer sem usuários associados. Sua eventual retirada deve ser explícita, após verificar referências em convites, funções e overrides; nunca apagar funções compartilhadas ou personalizações.

## Verificações

- Typecheck inicial: passou. Typecheck final: passou, executado separadamente do build.
- Testes unitários e regressões RBAC/migrations: 69 casos aprovados, incluindo ausência de sessão/vínculo, revogação, múltiplos fornecedores, isolamento entre pessoas e preservação do principal.
- Integração: 10 testes aprovados em PostgreSQL local descartável com atualização 0057 → 0058, fixtures comerciais, FKs/uniquidade e autorização real. A borda HTTP/Better Auth é simulada no teste das actions; o RBAC persistido, as consultas, transações e guards são os reais.
- Validador de migrations: atualização 58 → 59 e cadeia completa 0 → 59 aprovadas; estruturas finais idênticas. Containers descartáveis removidos no final.
- Build local: aprovado. A configuração existente do Next pula lint e typecheck no build; ambos foram executados separadamente.
- Lint global: 343 erros e 171 avisos preexistentes, com comparação antes/depois. A entrega não amplia esse passivo. Arquivos novos e trechos de infraestrutura são verificados à parte.
- Nenhuma página nova: teste visual/headless não se aplica.

Fechamento em 28/10/2026: o typecheck final (`npx tsc --noEmit --incremental false`) e o ESLint dos arquivos novos e da infraestrutura selecionada terminaram com código 0. O inventário Git foi conferido e `git diff --check` passou. Build, testes e operações de banco já concluídos não foram repetidos nesta retomada. O lint global permanece com o passivo preexistente descrito acima.

## Limites e trabalho necessário na Etapa 3

A Etapa 3 ainda precisa ligar as operações de produto a esse escopo, filtrar listagens/buscas no banco, conferir produto pai para variantes/imagens/estoque e validar todos os IDs em lotes e importações. Em escritas, a checagem e a gravação precisam de uma estratégia transacional que trate revogação concorrente. Um contexto retornado não é um token reutilizável de autorização.

O principal continua usando as actions administrativas existentes. Representantes recebem apenas o preset específico; adicionar outras funções ou overrides globais a uma pessoa continua concedendo essas capacidades pelo RBAC atual. Antes de habilitar contas reais, revisar composição de funções. O preset não tem `painel.visualizar`: não promete uma jornada de login/painel pronta nesta etapa.

As FKs `RESTRICT` preservam referências de liberações, mesmo revogadas. A Etapa 3 deve definir como excluir/arquivar um produto que tenha histórico de autorização; não inserir remoção automática de autorizações nas actions antigas nesta etapa.

Cadastro de novos produtos, modalidade única, bloqueio de variantes, categorias disponíveis, preço, estoque, atendimento Jaaa, comissão e logística continuam pendentes. A fundação não impõe ainda essas regras comerciais, nem autoriza cadastrar um produto inexistente. Nenhuma action legada de produto foi modificada.

## Inventário de arquivos

Os caminhos abaixo são relativos a `/home/junior/nuu`.

Criados:

- `docs/representantes-fornecedores-etapa-2.md`
- `drizzle/0058_representantes_fornecedores.sql`
- `drizzle/meta/0058_snapshot.json`
- `src/db/tables/representantes-fornecedores/relacoes.ts`
- `src/db/tables/representantes-fornecedores/tabelas.ts`
- `src/features/fornecedores/actions/representantes/salvar-autorizacao-produto-representante.ts`
- `src/features/fornecedores/actions/representantes/salvar-vinculo-representante.ts`
- `src/features/fornecedores/lib/representantes/autorizar-produto-representante.ts`
- `src/features/fornecedores/queries/representantes/buscar-escopo-representante.ts`
- `src/features/fornecedores/queries/representantes/exigir-acesso-produto-representante.ts`
- `src/features/fornecedores/queries/representantes/exigir-gestor-representantes.ts`
- `src/features/fornecedores/schemas/representantes/gestao-representantes.schema.ts`
- `src/features/fornecedores/scripts/registrar-funcao-representante.ts`
- `src/features/fornecedores/testes/representantes/autorizacao-representante.integracao.testes.ts`
- `src/features/fornecedores/testes/representantes/autorizacao-representante.testes.ts`
- `src/features/fornecedores/types/representantes/autorizacao-representante.types.ts`

Alterados:

- `drizzle/meta/_journal.json`
- `package.json`
- `scripts/lib/validar-cadeia-migrations.testes.ts`
- `scripts/lib/validar-cadeia-migrations.ts`
- `scripts/validar-e-aplicar-migrations.ts`
- `src/db/schema.ts`
- `src/features/administradores/constants/presets-administrativos.ts`
- `src/features/autenticacao/constants/permissoes-administrativas.testes.ts`
- `src/features/autenticacao/constants/permissoes-administrativas.ts`

O Git estava limpo no início. As alterações da entrega permanecem sem commit, push ou deploy; não havia arquivos modificados preexistentes não relacionados. A Etapa 3 não foi iniciada.
