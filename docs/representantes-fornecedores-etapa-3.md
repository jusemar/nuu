# Representantes de fornecedores — Etapa 3

Entrega local em 28/10/2026, continuando a fundação da [Etapa 2](representantes-fornecedores-etapa-2.md). Decisão expressa do usuário: **somente leitura; todas as alterações permanecem bloqueadas ao representante**. Não foi criado painel nem iniciada a Etapa 4.

## Autorização e operações protegidas

Better Auth continua fornecendo a identidade; o RBAC persistido continua fornecendo as capacidades. Não há autenticação paralela, autorização enviada pelo navegador nem associação comercial usada como liberação.

O contexto administrativo reconhece um representante pelo vínculo persistido, inclusive inativo, ou pelas capacidades específicas presentes em funções/overrides, inclusive revogados. Funções inativas são consideradas na identificação da restrição, mas continuam sem conceder permissões. Isso impede que revogar o vínculo ou acrescentar uma função global faça a conta passar ao catálogo administrativo inteiro. Para contas assim identificadas, as capacidades globais são negadas; o administrador principal mantém sua política global. Administradores internos sem representação mantêm o RBAC atual.

A leitura exige capacidade `representantes_produtos.visualizar`, vínculo administrativo ativo, vínculo individual ativo, fornecedor ativo e autorização individual ativa do produto. `representantes_produtos.administrar` continua no catálogo da Etapa 2, mas não libera gravações: a política de produto também nega explicitamente a operação `administrar` ao representante.

| Operação | Proteção efetiva |
| --- | --- |
| Listagem legada `getProducts` | Query do domínio com filtro SQL de autorização; representante recebe página limitada a 50 por padrão |
| Listagem paginada | Busca por nome, SKU, slug, códigos e marca; filtros de categoria, marca, status e atividade; paginação e contagem com o mesmo predicado de segurança |
| Detalhes legados `getProduct` e `getProductById` | Sessão e capacidade atuais; existência e autorização do produto antes de carregar filhos |
| Imagens de variante | Resolve o produto real da variante no banco; consulta final repete o predicado do produto |
| Galeria | Valida o produto e restringe a consulta por produto autorizado |
| Busca e configuração de venda cruzada | Autoriza o produto principal e filtra também os produtos oferecidos no SQL, antes do limite ou carregamento das relações |
| Cadastro, edição, preço, estoque e ativação | Guards globais existentes passam a negar representantes, mesmo com funções ou overrides adicionais |
| Publicação, duplicação, exclusão e arquivamento | Bloqueados ao representante; principal mantém as capacidades atuais, sujeito à integridade referencial |
| Criação/remoção/ordenação de imagens | Guards adicionados às actions legadas; entrada validada com Zod |
| Upload `/api/upload` | Guard existente de produto, banner ou logo recebe a restrição central; trocar o contexto não contorna o bloqueio |
| Variantes, atributos, identificadores e modalidades | Leitura somente dos filhos do produto autorizado; qualquer gravação continua bloqueada pelos pontos de entrada de edição/estrutura |
| Preview e alteração em massa | Requerem as capacidades globais existentes e permanecem bloqueados ao representante; lote misto é recusado antes de escrever |
| Importações, conciliações e fornecedores | Guards globais preservados; consulta Laquila antes baseada apenas em sessão agora exige `fornecedores.importar` |
| Auxiliares de promoções | Consultas administrativas de produtos, categorias, marcas, regiões e serviços exigem `marketing.administrar`; representantes são bloqueados |

O predicado usa `EXISTS` com autorização, vínculo e fornecedor do usuário autenticado. É aplicado antes de pesquisa, contagem, ordenação e limite; múltiplas liberações não duplicam produtos. Zod limita entradas, página e tamanho, e rejeita identidade/fornecedor injetados na nova listagem. IDs alheios e inexistentes recebem a mesma negação.

As consultas residem em `features/products/queries`, filtros em `schemas` e a regra pura permanece no domínio de fornecedores. Os arquivos legados continuam como entradas compatíveis; não foi feita reorganização ampla de produtos. As Server Actions de leitura são apenas adaptadores para as queries protegidas.

Diagnósticos logísticos e consultas de transportadoras não são disponibilizados ao representante pelos carregadores administrativos. Os fluxos do gestor e do catálogo público continuam usando os caminhos existentes. As leituras públicas, carrinho e checkout não receberam o filtro administrativo.

## Bloqueios e concorrência

Toda gravação de representante é recusada a cada chamada, antes da escrita, sem aceitar um contexto antigo fornecido pelo cliente. Assim, uma tela aberta antes da revogação não permite salvar, nem quando o produto ainda está autorizado. A liberação de gravações é zero nesta etapa; não existe janela entre uma autorização positiva de escrita do representante e um `UPDATE` posterior.

As leituras consultam o estado atual, sem cache de autorização. Revogar o produto, desativar o vínculo ou desativar o fornecedor bloqueia a próxima leitura. O teste concorrente mantém uma revogação não confirmada em uma conexão, tenta duas gravações em paralelo e confirma que ambas são negadas; após o commit, a leitura também é recusada.

A futura escrita autorizada exigirá uma política transacional própria para revogação, versão e conflitos no momento da gravação. Esta entrega não afirma implementar edição concorrente para representantes: ela permanece integralmente bloqueada.

## Exclusão e histórico

A exclusão pelo gestor usa `dbTransacional`, bloqueia a linha do produto com `FOR UPDATE` e verifica qualquer autorização de representante, ativa ou revogada. Havendo histórico, retorna recusa orientando desativar/arquivar; não remove liberações ou vínculos automaticamente.

A remoção dos preços e do produto ocorre na mesma transação. Se outra FK `RESTRICT`, como uma associação comercial, impedir a exclusão, a remoção dos preços também é desfeita. As FKs da Etapa 2 permanecem intactas. Produto sem referências impeditivas continua podendo ser excluído pelo gestor. Nenhuma política nova de apagamento de histórico foi criada.

## Verificações realizadas

Os testes aprovados antes da retomada foram preservados, sem repetição. Só foram concluídas as verificações pendentes e uma correção de tipagem da fixture do Next, sem alteração de comportamento em execução.

| Verificação | Resultado |
| --- | --- |
| Unitários e regressões RBAC, representantes, cadeia de migrations, produtos, alteração em massa e frete | 168 casos aprovados |
| Precificação, adaptação da vitrine e totais promocionais do checkout | 21 casos aprovados em processo com banco descartável explicitamente configurado |
| Integração de representantes e ações reais de produtos | 18 testes aprovados, incluindo os testes agrupadores do runner |
| Regressão real de checkout/estoque | 25 testes aprovados em PostgreSQL descartável |
| Typecheck final | Aprovado, código 0, sem diagnósticos (`tsc --noEmit --incremental false`) |
| ESLint dos 31 arquivos TypeScript da Etapa 3 | Código 0, sem erros ou avisos; arquivo da fixture revisto após a correção apenas de tipo |
| Lint global | 338 erros e 169 avisos preexistentes; base documentada da Etapa 2 era 343 erros e 171 avisos |
| Build local | Concluído anteriormente, com banco fixado pelo lançador local e `APP_ENVIRONMENT=homologacao`; artefatos finais e evento `next-build` completo confirmados nesta retomada, sem repetir o build |
| `git diff --check` | Aprovado |

A primeira execução de três arquivos de regressão foi recusada pela guarda de destino por falta de configuração explícita; nenhuma consulta foi executada contra produção. Esses arquivos foram então executados com sucesso no banco descartável, totalizando os 21 casos informados acima. O typecheck pendente encontrou apenas a coerção da fixture parcial de `WorkStore`; ela foi explicitada via `unknown` e validada novamente.

A integração simula somente a borda de sessão Better Auth e o contexto de requisição Next. Usa os guards, RBAC persistido, queries, actions e transações reais. Cobre IDs adulterados, paginação/contagem, recursos filhos, permissões extras, escrita/lote bloqueados, fornecedor inativo, revogação, concorrência, histórico ativo/revogado, rollback de preço, exclusão permitida e produto público elegível para representante/usuário comum/visitante. A regressão do checkout cobre disputa de estoque, pagamentos, cancelamentos e modalidades sem débito local. Nenhum pagamento externo foi criado.

Não houve alteração de UI ou criação de página. A rota de upload foi exercitada diretamente nos testes, verificando negação antes do envio ao storage; não se realizou ensaio visual de um painel inexistente.

## Banco, migrations e preservação

Nenhuma migration nova foi necessária na Etapa 3. A migration 0058 e as alterações de infraestrutura da Etapa 2 já existentes foram preservadas; não foram reaplicadas ao banco persistente nesta etapa.

Destino local conferido: container `nooo-postgres-local`, banco `nooo_desenvolvimento`, usuário `nooo`, `cluster_name=nooo-postgres-local`. Verificação final somente leitura:

- 149 produtos, 8 fornecedores e 124 associações comerciais, iguais às contagens registradas na Etapa 2;
- 59 migrations aplicadas;
- zero vínculos de representantes e zero autorizações de produtos no banco persistente;
- zero FKs não validadas;
- zero associações comerciais órfãs e zero autorizações órfãs.

Fixtures, alterações de preços/estoques/produtos e ensaios de exclusão existiram somente nos bancos Docker descartáveis. Os testes compararam retratos completos dos dados de catálogo, preços, estoque e associações e confirmaram sua preservação após tentativas negadas. Não houve DML de teste no banco persistente nem atribuição de função a usuário real. Os arquivos temporários da execução anterior não sobreviveram à retomada; portanto, não se apresenta uma comparação de hashes antes/depois do banco persistente como evidência desta etapa. A evidência local recuperável é a conferência de identidade, contagens e integridade acima, junto ao isolamento dos ensaios.

Não houve acesso à Neon ou produção, commit, push ou deploy.

## Pendências para a Etapa 4

- Aprovar quais gravações poderão existir e qual será a modalidade única de preço; criação e edição de produtos simples continuam bloqueadas.
- Antes de liberar escrita, implementar a autorização dentro da transação efetiva, com estratégia de revogação e conflitos adequada à operação.
- Projetar e aprovar a interface e a jornada do representante; as leituras protegidas desta etapa não concedem acesso automático às rotas globais do painel.
- Definir regra comercial de exclusão/retensão; autorizações históricas continuam impedindo a exclusão física.
- Revisar contas com composição de funções: qualquer vínculo de representação, inclusive inativo, mantém a restrição; retirar essa classificação exige gestão explícita dos vínculos e concessões, sem compensação automática com permissões globais.
- O passivo de lint global permanece fora desta entrega.

Comissão, Jaaa, implementação de logística e painel de representantes não foram iniciados.

## Arquivos da Etapa 3

Caminhos relativos a `/home/junior/nuu`. A listagem distingue esta etapa das alterações já existentes da Etapa 2.

Criados:

- `docs/representantes-fornecedores-etapa-3.md`
- `src/features/products/actions/listar-produtos-admin-paginados.ts`
- `src/features/products/queries/autorizacao/escopo-produtos-admin.ts`
- `src/features/products/queries/listagem/listar-produtos-admin.ts`
- `src/features/products/schemas/listagem/filtros-produtos-admin.schema.ts`
- `src/features/products/testes/representantes/isolamento-produtos.integracao.ts`

Alterados:

- `docs/representantes-fornecedores-etapa-2.md` (nota de continuidade, mantendo o registro histórico)
- `src/actions/admin/products/delete.ts`
- `src/actions/admin/products/get-id.ts`
- `src/actions/admin/products/get.ts`
- `src/actions/admin/products/product-images/create.ts`
- `src/actions/admin/products/product-images/delete.ts`
- `src/actions/admin/products/product-images/get.ts`
- `src/actions/admin/products/product-images/update-order.ts`
- `src/features/admin/products/service/getProductById.ts`
- `src/features/admin/products/service/productImageGalleryService.ts`
- `src/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin.testes.ts`
- `src/features/autenticacao/lib/autorizacao-admin/resolver-autorizacao-admin.ts`
- `src/features/autenticacao/queries/autorizacao-admin/buscar-dados-autorizacao-admin.ts`
- `src/features/autenticacao/types/autorizacao-admin.types.ts`
- `src/features/fornecedores/integracoes/laquila/actions/consultar-produtos-laquila.ts`
- `src/features/fornecedores/lib/representantes/autorizar-produto-representante.ts`
- `src/features/fornecedores/testes/representantes/autorizacao-representante.integracao.testes.ts`
- `src/features/fornecedores/testes/representantes/autorizacao-representante.testes.ts`
- `src/features/products/actions/buscar-configuracao-venda-cruzada-admin.ts`
- `src/features/products/actions/buscar-produtos-venda-cruzada-admin.ts`
- `src/features/products/queries/venda-cruzada/buscar-configuracao-venda-cruzada-admin.ts`
- `src/features/products/queries/venda-cruzada/buscar-produtos-venda-cruzada-admin.ts`
- `src/features/promocoes/queries/buscar-categorias-promocao-admin.ts`
- `src/features/promocoes/queries/buscar-fretes-servicos-promocao-admin.ts`
- `src/features/promocoes/queries/buscar-marcas-promocao-admin.ts`
- `src/features/promocoes/queries/buscar-produtos-promocao-admin.ts`
- `src/features/promocoes/queries/buscar-regioes-promocao-admin.ts`

## Estado final do Git

Estado conferido ao final: 32 arquivos rastreados modificados e 22 arquivos não rastreados, somando as Etapas 2 e 3; staging vazio. As alterações permanecem no diretório de trabalho, sem commit, push ou deploy. A base continua no commit `a139e75` (`fix(laquila): adequa cron ao plano Vercel`). O inventário anterior da Etapa 2 está no respectivo documento; esta entrega não removeu nem refez esses arquivos. O schema e as migrations não receberam mudanças adicionais na Etapa 3.
