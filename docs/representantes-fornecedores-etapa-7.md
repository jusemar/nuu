# Etapa 7 — Vendas e gestão de comissões

Implementação local sobre as Etapas 5 e 6. Não altera o motor de cálculo, o checkout, a atribuição por produto nem os eventos de confirmação, cancelamento e estorno. Não houve acesso à produção, commit, push ou deploy.

## Telas e navegação

A rota real `/admin/comissoes-representantes` usa o layout administrativo existente e duas apresentações autorizadas no servidor:

- Representante: **Vendas / Comissões**, com suas vendas confirmadas, indicadores, filtros e detalhes. Acesso pelo menu desktop e pela navegação rápida mobile; identificação com nome e empresa preservada.
- Gestor principal: **Comissões de representantes**, com consulta geral, filtros por representante/fornecedor e registro de quitação externa nos detalhes.

A listagem apresenta data, nome e SKU históricos, referência do pedido, fornecedor daquela venda, quantidade, valor líquido vendido, comissão e situação. Os detalhes acrescentam preço comercial unitário, desconto do item, regra histórica e eventos. O gestor pode abrir o pedido pelo fluxo administrativo existente.

No celular, as linhas são cards, os indicadores usam duas colunas, os filtros ficam empilhados e os detalhes usam o Dialog do design system com rolagem limitada à altura da tela. Botões de consulta, filtro, paginação e quitação têm área mínima de 44 px. Não depende de hover.

## Arquitetura e consultas

Tudo pertence ao domínio `src/features/checkout`, nas subpastas `painel-comissoes` de `queries`, `lib`, `types`, `schemas`, `actions`, `hooks`, `constants`, `components/admin` e `testes`. `app` somente conecta a rota ao componente de entrada. Server Actions de consulta são adaptadores finos para queries server-only; a única escrita do módulo é a quitação.

A CTE em `consulta-base.ts` une snapshots, itens/pedidos históricos, usuário titular e fornecedor referenciado na venda. Não consulta cliente, configuração de comissão, preço, produto atual ou representante comissionado atual do produto. Nome e SKU vêm do item congelado; fornecedor e representante são os IDs históricos, com o nome cadastral atual dessas entidades para apresentação. Assim, renomear a entidade pode mudar seu rótulo, mas não sua identidade histórica.

O status SQL é compilado da mesma política pura que valida quitações. A listagem e os agregados são duas consultas dentro de uma transação somente leitura, repeatable-read. Filtros, contagem, agregação e paginação são feitos no PostgreSQL; 20 registros por página. Não há N+1: os eventos são consultados apenas ao abrir um detalhe e têm no máximo os três tipos do contrato da Etapa 6. O gestor consulta o responsável pela quitação daquele detalhe em uma consulta adicional de tamanho fixo. As opções dos filtros administrativos vêm de duas consultas DISTINCT às identidades presentes no histórico.

Datas do período são inclusivas no fuso `America/Sao_Paulo`, usando o limite exclusivo do dia seguinte. A data apresentada é a criação do registro congelado no checkout, não a data do pagamento externo. Conversões usam timestamp explícito antes de AT TIME ZONE, evitando coerção implícita de date via timezone da conexão. Busca por pedido/produto/SKU e demais entradas são parametrizadas e validadas com Zod.

## Status centralizados

Precedência única, da maior para a menor:

1. **Invalidada por estorno:** evento `estornada` ou pedido efetivamente `refunded`.
2. **Invalidada por cancelamento:** evento `cancelada` ou pedido efetivamente `canceled`.
3. **Aguardando confirmação:** sem evento `confirmada`; disponível somente ao gestor.
4. **Quitada:** confirmada, não invalidada e com registro separado de quitação.
5. **A receber:** confirmada, válida e sem quitação.

O estado real cancelado/estornado do pedido bloqueia a validade mesmo durante eventual atraso de reconciliação dos eventos. Cancelamentos e estornos confirmados continuam no histórico. Uma quitação anterior permanece registrada após invalidação; a situação passa a invalidada, sem apagar ou reescrever o pagamento externo reconhecido.

## Isolamento e privacidade

Cada query/action valida sessão e contexto administrativo novamente. Representante requer administrador ativo, identificação como representante e a permissão existente de visualização da área restrita de produtos. Isso não concede leitura global de pedidos, clientes ou finanças. Gestão exige o guard existente `exigirGestorRepresentantes` e administrador principal ativo. Não foram criadas permissões globais ou alterada a fundação RBAC.

O SQL inclui obrigatoriamente `representante_usuario_id = sessão.userId` antes de paginação, contagem, totais ou detalhes. Um filtro `representanteId` enviado pelo representante é recusado. Conhecer ID de outra comissão não permite abrir detalhes. As consultas de eventos e quitação só ocorrem depois de encontrar o registro no escopo autorizado.

DTOs usam lista explícita de campos. O representante não recebe IDs navegáveis de pedidos administrativos, responsável pela quitação, referência/observação interna, dados de cliente, custos ou margens. SQL projeta referência/observação como NULL para representantes. Registros sem snapshot não entram no painel.

O extrato histórico não depende de autorização comercial atual ao produto: o titular pode acompanhar seu histórico enquanto mantiver sessão e acesso administrativo permitido. Escritas em produtos e revogações continuam nas proteções existentes, sem mudanças nesta etapa.

## Comissão oculta: futuro e histórico

A configuração de comissão futura continua sob a visibilidade já existente no produto. O painel não consulta nem devolve essa configuração. Para o representante, somente snapshots com evento de confirmação são consultáveis: propostas ainda não confirmadas não revelam antecipadamente uma regra oculta.

Depois da confirmação, o titular visualiza a regra e o valor efetivamente congelados para aquela venda, mesmo que a configuração futura esteja oculta, inativa, tenha outro percentual ou outro destinatário. Não se recalcula o passado. Pendências sem confirmação ficam restritas ao gestor.

## Totalizadores

Todos respeitam o escopo e os filtros, em todas as páginas:

| Indicador | Regra |
| --- | --- |
| Itens no período | Quantidade de registros históricos filtrados; não é quantidade de pedidos distintos nem soma de unidades |
| Vendido válido | Soma do valor líquido histórico dos itens a receber ou quitados |
| Comissão válida | Soma da comissão histórica dos itens a receber ou quitados |
| A receber | Soma da comissão histórica válida ainda sem quitação |
| Invalidada | Soma da comissão histórica cancelada ou estornada |
| Quitado histórico | Soma dos registros externos de quitação, inclusive se invalidados posteriormente |

Comissões aguardando confirmação não compõem valores válidos. Quitado histórico e invalidada podem se sobrepor quando a invalidação acontece após o pagamento externo; a interface informa isso explicitamente. Não há carteira, saldo sacável ou valor disponível para transferência. Agregados monetários são numeric/text no SQL e formatados com BigInt, evitando perda de centavos por conversão a Number.

## Quitação manual

Implementada como reconhecimento **integral de um pagamento externo já realizado**, não como execução de pagamento. Não aceita valor escolhido pelo cliente: deriva o valor exclusivamente do snapshot. Registra data externa, instante do registro, administrador responsável, valor, referência opcional e observação interna. Referência e observação são somente administrativas.

A transação bloqueia o pedido pelo mesmo protocolo de confirmação/cancelamento da Etapa 6, verifica eventos, situação real do pedido e pagamento, e revalida administrador principal ativo com lock. Exige pagamento confirmado e pedido paid/processing/shipped/delivered. Recusa pendência, cancelamento, estorno, data futura, data anterior à venda e payload com valor arbitrário.

Índice único por comissão e lock do pedido impedem duplicidade, inclusive com solicitações concorrentes. Repetição válida retorna o registro existente, sem substituir valor, data ou referência. O registro é apenas inserido; não existem ações de edição/exclusão. Uma auditoria administrativa é inserida na mesma transação. Os snapshots e eventos originais não são alterados.

Se houver invalidação depois da quitação, o histórico preserva os dois fatos para conferência. Compensação ou recuperação do valor pago externamente não é automatizada nesta etapa.

## Banco e migration

Criada pelo Drizzle a migration `0063_painel_quitacoes_comissoes.sql`, com snapshot e journal oficiais:

- Nova tabela `checkout_item_comissao_quitacoes`, FKs restritivas, valor inteiro válido e índice único por comissão.
- Índice `(representante_usuario_id, created_at, id)`: escopo obrigatório do titular com período e ordenação/paginação estável. O índice prévio apenas por titular não cobria essa ordenação.
- Índice `(created_at, id)`: período e ordenação/paginação da consulta geral administrativa, que não restringe um titular.

Não foram adicionados índices especulativos de texto/fornecedor/status. O delta dos snapshots 0062→0063 foi validado: somente a nova tabela e esses dois índices. A cadeia oficial passou a 64 migrations; a sequência/hash/journal foram validados offline pelo validador oficial. A migração foi ensaiada em PostgreSQL Docker descartável e aplicada somente em `nooo-postgres-local`, pelo comando oficial `npm run migrations:local`: **63/64 → 64/64**.

Comparação integral de contagens e hashes dos registros antes/depois: **28 tabelas anteriores idênticas**, incluindo produtos, pedidos/itens, atribuições por produto, snapshots, eventos, usuários, contas e permissões. **149 produtos preservados.** Fixtures e quitações de teste existiram somente nos bancos Docker descartáveis.

## Validações da Etapa 7

Sem repetir as suítes das Etapas 2–6:

- Testes unitários direcionados: **3/3 aprovados** — precedência dos estados, preservação de centavos acima do limite de Number, formatação de regra e validação estrita de filtros/payload.
- Integração com PostgreSQL descartável: **7/7 cenários aprovados** — dois representantes isolados e IDOR, paginação 20+5, filtros administrativos, produto/fornecedor históricos, percentual/fixo congelados apesar de configuração atual diferente/oculta/inativa e destinatário atual diferente, itens comuns excluídos, totais sem invalidados, acesso negado sem autorização, quitação concorrente idempotente, campos internos omitidos, snapshot intacto, invalidação posterior mantendo quitação, cancelamento concorrente impedindo quitação e fronteiras de meia-noite brasileira.
- Navegador Playwright contra Next real e PostgreSQL descartável: **aprovado nos dois perfis e viewports** — autenticação real de fixtures, desktop 1440×1000 e Android Pixel 7 para representante e gestor; filtros, paginação, detalhes, quitação administrativa persistida, situação paga para titular, observações internas omitidas, navegação mobile, botões de toque (inclusive fechar com 44 px), formulário administrativo com rolagem e ausência de overflow. Data externa conferida no fuso brasileiro. Capturas em `docs/prototipos/representante-etapa-7/`.
- Inspeção visual das capturas detectou e permitiu corrigir a coerção implícita de fuso, além de compactar os indicadores mobile. Não houve redefinição de senha de usuário real.
- Lint direcionado: sem erros; 22 avisos preexistentes de declarações não utilizadas no agregador `src/db/schema.ts`. Não foram alteradas essas declarações alheias à etapa.
- Typecheck: **aprovado**. Build local: **aprovado**, incluindo compilação e coleta/geração das rotas. Build usa identidade do banco local validada, variáveis fictícias de integrações e saída isolada `.next/etapa7-build`.

Comandos específicos reproduzíveis em ambiente local autorizado:

```bash
node --import tsx src/features/checkout/testes/painel-comissoes/situacao.testes.ts
NODE_OPTIONS=--conditions=react-server node --import tsx src/features/checkout/testes/painel-comissoes/painel.integracao.testes.ts
node --import tsx src/features/checkout/testes/painel-comissoes/painel.interface.testes.ts
npx tsc --noEmit
```

O teste de interface usa credenciais fictícias apenas em Docker descartável, inicia servidor Next isolado e encerra seus próprios processos. Não utiliza usuários ou credenciais reais.

## Limites e continuidade

A Etapa 7 entrega consulta e quitação externa integral por item comissionado. Não implementa pagamentos automáticos, quitações parciais/em lote, saques, carteira, split, emissão fiscal, PSP, logística, Jaaa ou qualquer funcionalidade da Etapa 8. Nenhuma dessas expansões é requisito pendente desta etapa. Eventual compensação de quitações posteriormente invalidadas continua sendo conferência administrativa externa.

Disponibilização em produção dependerá de autorização posterior para publicar o código e aplicar a cadeia pendente pelo procedimento oficial. Produção não foi acessada. O protótipo aprovado da Etapa 4 foi preservado.

## Arquivos desta etapa

A lista abaixo contém somente o delta da Etapa 7 em relação ao estado local de entrada, sem atribuir a esta etapa as mudanças anteriores ainda não commitadas.

- `/home/junior/nuu/docs/prototipos/representante-etapa-7/gestor-android-detalhes.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-7/gestor-android-formulario.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-7/gestor-desktop-quitacao.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-7/representante-android-detalhes.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-7/representante-android.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-7/representante-desktop.png`
- `/home/junior/nuu/docs/representantes-fornecedores-etapa-7.md`
- `/home/junior/nuu/drizzle/0063_painel_quitacoes_comissoes.sql`
- `/home/junior/nuu/drizzle/meta/0063_snapshot.json`
- `/home/junior/nuu/drizzle/meta/_journal.json`
- `/home/junior/nuu/scripts/lib/validar-cadeia-migrations.ts`
- `/home/junior/nuu/scripts/validar-e-aplicar-migrations.ts`
- `/home/junior/nuu/src/app/admin/comissoes-representantes/page.tsx`
- `/home/junior/nuu/src/app/admin/layout.tsx`
- `/home/junior/nuu/src/components/admin/header.tsx`
- `/home/junior/nuu/src/db/schema.ts`
- `/home/junior/nuu/src/db/tables/checkout/tabelas/item-comissao-quitacoes.ts`
- `/home/junior/nuu/src/db/tables/checkout/tabelas/item-comissoes.ts`
- `/home/junior/nuu/src/features/admin/layout/components/sidebar.tsx`
- `/home/junior/nuu/src/features/checkout/actions/painel-comissoes/consultar-painel.ts`
- `/home/junior/nuu/src/features/checkout/actions/painel-comissoes/registrar-quitacao.ts`
- `/home/junior/nuu/src/features/checkout/components/admin/painel-comissoes/cartoes-comissoes.tsx`
- `/home/junior/nuu/src/features/checkout/components/admin/painel-comissoes/detalhe-comissao.tsx`
- `/home/junior/nuu/src/features/checkout/components/admin/painel-comissoes/filtros-comissoes.tsx`
- `/home/junior/nuu/src/features/checkout/components/admin/painel-comissoes/listagem-comissoes.tsx`
- `/home/junior/nuu/src/features/checkout/components/admin/painel-comissoes/pagina-comissoes.tsx`
- `/home/junior/nuu/src/features/checkout/components/admin/painel-comissoes/painel-comissoes.tsx`
- `/home/junior/nuu/src/features/checkout/components/admin/painel-comissoes/quitacao-manual.tsx`
- `/home/junior/nuu/src/features/checkout/constants/painel-comissoes/chaves.ts`
- `/home/junior/nuu/src/features/checkout/hooks/painel-comissoes/use-painel-comissoes.ts`
- `/home/junior/nuu/src/features/checkout/lib/painel-comissoes/formatar-valores.ts`
- `/home/junior/nuu/src/features/checkout/lib/painel-comissoes/situacao-comissao.ts`
- `/home/junior/nuu/src/features/checkout/queries/painel-comissoes/acesso-painel.ts`
- `/home/junior/nuu/src/features/checkout/queries/painel-comissoes/consulta-base.ts`
- `/home/junior/nuu/src/features/checkout/queries/painel-comissoes/detalhar-comissao.ts`
- `/home/junior/nuu/src/features/checkout/queries/painel-comissoes/listar-comissoes.ts`
- `/home/junior/nuu/src/features/checkout/queries/painel-comissoes/opcoes-filtros.ts`
- `/home/junior/nuu/src/features/checkout/schemas/painel-comissoes/painel.schema.ts`
- `/home/junior/nuu/src/features/checkout/testes/painel-comissoes/fixture-painel.ts`
- `/home/junior/nuu/src/features/checkout/testes/painel-comissoes/painel.integracao.testes.ts`
- `/home/junior/nuu/src/features/checkout/testes/painel-comissoes/painel.interface.testes.ts`
- `/home/junior/nuu/src/features/checkout/testes/painel-comissoes/situacao.testes.ts`
- `/home/junior/nuu/src/features/checkout/testes/painel-comissoes/validar-interface-painel.ts`
- `/home/junior/nuu/src/features/checkout/types/painel-comissoes/painel.types.ts`
