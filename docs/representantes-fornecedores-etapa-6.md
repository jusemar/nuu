# Etapa 6 — Pedidos e snapshot de comissão

## Auditoria cirúrgica e decisões

Base: commit local 933a885 (Etapa 5), preservado. Apenas tabelas/serviços de pedido, itens, totais, confirmação, cancelamento e reembolso necessários foram consultados.

- O pedido nasce `pending`, com chave idempotente única e transação de pedido/itens/estoque/pontos. Criar pedido não comprova venda paga.
- Stripe e Efí confirmam pagamento pelo núcleo transacional `confirmarPagamentoRecebido`, serializado pela linha do pedido. Pagamento tardio sem recursos é reconhecido como dinheiro recebido, mas não autoriza atendimento. Repetições não realocam recursos.
- Pagamento na entrega tem baixa administrativa própria, CAS e lock do pedido; é outro ponto real de confirmação.
- Cancelamento pré-envio grava `canceled`; reembolso completo confirmado grava `refunded`. Após envio/entrega, o fluxo orienta atendimento/devolução, sem um sistema estruturado de devolução parcial. Não será inventado um.
- Cupom já usa o método das maiores sobras (`ratearCupomEntreItens`), com desempate estável. Crédito de fidelidade já tem rateio por item após cupom. Frete promocional não integra desconto do produto.
- Preço promocional comercial aparece no resumo oficial por item. O preço de cartão inclui acréscimo e o total pode incluir juros; esses adicionais não serão base comissionável. Serão congeladas a base comercial sem acréscimos e a parcela de cupom existente por item, sem mudar totais/cobrança.

**Regra vigente corrigida (opção 1):** o gestor define no PRODUTO o único representante comissionado para as próximas vendas. O checkout captura automaticamente essa escolha nos itens, sem campos de destinatário aceitos do navegador. A implementação inicial de atribuição manual por pedido foi substituída.

## Escolha no produto e captura automática

A configuração reutiliza o modal de comissão do produto: “Representante comissionado nas próximas vendas”, com opção “Nenhum representante”. Autorizações de edição e valores de comissão continuam independentes dessa escolha. Ter vários representantes autorizados ou várias regras ativas não atribui a venda a nenhum deles automaticamente.

A tabela `representantes_comissionados_produtos` guarda uma única escolha por produto, o ID da autorização individual e o gestor responsável. Somente o principal ativo pode alterá-la. O servidor valida produto simples/Fornecedor, autorização e comissão ativas, vínculo e fornecedor ativos e associação comercial correspondente. Não há fallback por fornecedor, criador ou último editor.

O checkout, na transação que cria pedido e itens, lê exclusivamente essa configuração do servidor, revalida as relações e grava o snapshot da Etapa 5 no modelo da 0061. Uma chave transacional por produto serializa alteração/ausência da escolha com a captura; locks das relações mantêm a regra consistente. Carrinhos com vários produtos adquirem essas chaves em ordem estável.

Sem escolha, ou com relação revogada/inválida, a compra segue sem comissão e sem escolher outro autorizado. O snapshot é uma proposta congelada na criação do item; continua sendo confirmado apenas pelo pagamento real, nos mesmos eventos já aprovados. Trocar ou remover a escolha só afeta vendas criadas depois: não modifica pedidos existentes, mesmo ainda pendentes. Retries e reconciliação não buscam novos destinatários nem recriam atribuições ausentes.

O seletor manual foi retirado dos pedidos. O endpoint antigo permanece somente como resposta de recusa, para impedir gravações a partir de abas antigas. Os componentes, hooks e consultas que sustentavam aquela seleção foram removidos. Nenhuma tela financeira nova foi criada.

## Base comercial e descontos

Itens novos guardam `preco_comercial_unitario_em_centavos` da mesma cotação oficial que calcula os totais, sem acréscimo de cartão/juros, e `desconto_cupom_rateado_em_centavos`. O crédito de fidelidade rateado já existia e é reutilizado.

O rateio de cupom usa exatamente `ratearCupomEntreItens` e os mesmos valores/IDs usados pelo rateio de fidelidade do checkout. A base por item é o preço comercial promocional × quantidade, menos cupom atribuído ao item e crédito de fidelidade, limitada a zero. Descontos promocionais já presentes no preço comercial não são descontados uma segunda vez. Frete promocional, frete cobrado, acréscimos de cartão e juros do pedido não entram na base. Desconto global não ganha um novo critério de distribuição nesta etapa.

IDs de linhas do carrinho ambíguos não geram uma base atribuível, sem introduzir impedimento adicional à venda. Itens legados ficam com as duas novas colunas NULL; não são recalculados pelo catálogo atual e não permitem atribuição retroativa. Os campos comerciais não contêm regra, representante ou valor de comissão.

O serviço reutiliza `criarSnapshotComissaoRepresentante` e o motor da Etapa 5, sem duplicar fórmula. Aritmética nova usa inteiros/BigInt. Percentual usa a base líquida; fixa usa quantidade. Alteração posterior de preço, desconto de catálogo, regra, ativação, visibilidade ou vínculo não reescreve a proposta já aceita.

## Estrutura persistida e idempotência

`checkout_item_comissoes` contém IDs do pedido/item/produto, representante, fornecedor, autorização, gestor que atribuiu e datas, além do JSON tipado do snapshot da Etapa 5. Esse JSON copia quantidade, preço comercial vendido, desconto, base líquida, tipo/valor/versão da regra, comissão calculada, momento e arredondamento.

`checkout_item_comissao_eventos` é histórico aditivo de `confirmada`, `cancelada` e `estornada`. Esses são eventos da comissão, não novos status de pedido. O snapshot não é atualizado para registrar efeitos posteriores. As APIs desta etapa apenas inserem/leem snapshots e inserem eventos; não existe escrita pública para substituir ou apagar histórico. FKs restritivas preservam os registros relacionados.

Proteções de banco:

- índice único por `pedido_item_id`: zero ou uma atribuição/snapshot por item;
- índice único `(comissao_id, tipo)`: retries e concorrência não duplicam o mesmo efeito;
- FKs de pedido/item/representante/fornecedor/autorização/gestor;
- CHECK dos tipos de evento.

A escolha no produto e sua auditoria pertencem à mesma transação. O snapshot de cada item é gravado na transação de criação do checkout. Confirmar, cancelar e estornar disputam a linha do pedido, como os fluxos anteriores. Não há dependência do ID de um webhook específico para idempotência comercial: qualquer repetição equivalente converge para o mesmo evento único.

## Eventos reais e recuperação

| Situação real | Efeito da comissão |
| --- | --- |
| Pedido criado sem escolha válida no produto | Nenhum |
| Checkout cria item com escolha válida no produto | Proposta e regra congeladas automaticamente, ainda não devidas |
| Confirmação online com pagamento `paid` e recursos prontos | Insere `confirmada` para as propostas existentes |
| Baixa real de pagamento na entrega | Insere `confirmada`, preservando pedido já enviado/entregue |
| Pagamento recebido após cancelamento ou sem recursos | Não confirma comissão |
| Expiração de cobrança | Não confirma nem cancela definitivamente a proposta; um pagamento tardio válido pode recuperá-la conforme o fluxo existente |
| Pedido `canceled` | Insere `cancelada`, preservando snapshot |
| Pedido `refunded` | Insere `estornada`, preservando snapshot |
| Orientação de atendimento/devolução sem evento comprovado | Não inventa devolução ou rateio parcial |
| Reprocessamento | Completa efeito ausente, sem recalcular regra/valor |

Para interpretar o estado comercial, estorno e cancelamento prevalecem sobre confirmação. Eventos não são uma carteira ou uma soma de repasses. Não existe pagamento ao representante.

O processamento opcional roda em savepoint: uma falha de comissão não desfaz pagamento ou cancelamento. A transação interna evita eventos parcialmente persistidos; o snapshot original continua disponível. O reconciliador de pagamentos já existente chama uma reconciliação local limitada a 100 pedidos com efeitos ausentes, sem nova consulta a gateway e sem redescobrir representante. Erros registram apenas código operacional e ID do pedido, sem credenciais.

A integração de reembolso acompanha o estado `refunded` que o fluxo atual realmente grava. Reembolso ainda em processamento já tem pedido cancelado e comissão invalidada comercialmente. Não foram acrescentados webhooks de estorno, devolução parcial ou estados de pagamento que o projeto não oferece.

## Migration e preservação

Migration oficial gerada pelo Drizzle: `0061_snapshots_comissoes_itens_pedido`. Acrescenta somente duas tabelas e duas colunas comerciais nullable nos itens. Atualizados journal/snapshot e validador do delta permitido. Nenhuma migration anterior foi editada.

Testes descartáveis aplicaram a cadeia anterior e a atualização. O delta legítimo passou e uma alteração indevida de tabela anterior foi rejeitada. Aplicação somente no PostgreSQL persistente `nooo-postgres-local`: **61 → 62**, agora **62/62**.

Comparação por contagem/hash de 25 tabelas antes/depois, excluindo só as duas colunas novas: **zero divergências nos dados anteriores**, incluindo os **149 produtos**. Nenhuma conta real recebeu atribuição, permissão ou configuração de comissão; fixtures ficaram somente em containers descartáveis.

## Testes e evidências

- **9 cenários de integração aprovados** (10 registros TAP incluindo o agrupador): pedidos reais sem atribuição e produto normal; dois representantes autorizados e um explicitamente escolhido; percentual e desconto; fixa e quantidade; regra posteriormente alterada/desativada; corrida de pagamento e de atribuição; IDs adulterados e fornecedor inconsistente; cancelamento pelo fluxo administrativo e efeito do estado real de estorno; falha opcional com pagamento preservado/reconciliação; cupom real; acréscimo de cartão excluído; baixa real na entrega após envio; revogação concorrente e pagamento tardio válido após expiração.
- **3 testes puros aprovados**: base líquida, item legado, desconto limitado a zero e reaproveitamento do rateio por maiores sobras.
- **Navegador aprovado** em desktop e Android Pixel 7 (393 × 851): ação no pedido existente, seleção inicialmente vazia, atribuições separadas para dois itens, persistência e mensagem somente leitura. Dialog utilizável por toque e contido na viewport, sem erros JavaScript.
- Capturas: [desktop](prototipos/representante-etapa-6/atribuicao-desktop.png) e [Android](prototipos/representante-etapa-6/atribuicao-android.png).
- Lint direcionado sem erros. Permanecem 24 avisos preexistentes em `src/db/schema.ts` e na action legada de cancelamento; nenhum aviso da nova área.
- `git diff --check` aprovado.
- `npm run build` aprovado, com destino local conferido pela guarda oficial e saída isolada `.next/etapa6-build`. A verificação remota de schema foi ignorada fora da Vercel de produção.
- `tsc --noEmit --incremental false` aprovado, saída 0. Configuração temporária do Next removida e `tsconfig.json` restaurado ao conteúdo anterior à etapa.

Não foram repetidas as baterias gerais das Etapas 2–5. As tentativas iniciais dos testes desta etapa ajustaram apenas campos obrigatórios de fixtures e seus roteiros, antes da execução conclusiva aprovada.

## Escopo preservado e limites

Não houve produção/Neon, commit, push, deploy ou início da Etapa 7. O commit base continua 933a885. A integração não cria carteira, saldo, saque, Pix, repasse, pagamento, dashboard financeiro, logística específica, marketplace ou Jaaa.

Para uma futura Etapa 7, qualquer extrato/pagamento deverá consumir snapshot e eventos históricos, respeitando cancelamento/estorno e idempotência. Escolhas futuras no produto não alteram snapshots anteriores; atribuição manual ou retroativa por pedido permanece indisponível. Devolução/estorno parcial requererá informação real por item e uma decisão de domínio própria, sem rateio inventado nesta etapa.

## Arquivos criados/alterados nesta etapa (inventário vigente)

- `/home/junior/nuu/docs/prototipos/representante-etapa-6/atribuicao-android.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-6/atribuicao-desktop.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-6/produto-comissionado-android.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-6/produto-comissionado-desktop.png`
- `/home/junior/nuu/docs/representantes-fornecedores-etapa-6.md`
- `/home/junior/nuu/drizzle/0061_snapshots_comissoes_itens_pedido.sql`
- `/home/junior/nuu/drizzle/0062_comissionado_unico_produto.sql`
- `/home/junior/nuu/drizzle/meta/0061_snapshot.json`
- `/home/junior/nuu/drizzle/meta/0062_snapshot.json`
- `/home/junior/nuu/drizzle/meta/_journal.json`
- `/home/junior/nuu/scripts/lib/validar-cadeia-migrations.ts`
- `/home/junior/nuu/scripts/validar-e-aplicar-migrations.ts`
- `/home/junior/nuu/src/db/schema.ts`
- `/home/junior/nuu/src/db/tables/checkout/index.ts`
- `/home/junior/nuu/src/db/tables/checkout/tabelas/item-comissoes.ts`
- `/home/junior/nuu/src/db/tables/checkout/tabelas/pedido-itens.ts`
- `/home/junior/nuu/src/db/tables/representantes-fornecedores/comissionado-produto.ts`
- `/home/junior/nuu/src/features/checkout/actions/cancelamentos/cancelar-pedido-cliente.ts`
- `/home/junior/nuu/src/features/checkout/actions/comissoes-representantes/atribuir-representante-item.ts`
- `/home/junior/nuu/src/features/checkout/actions/comissoes-representantes/capturar-comissoes-checkout.ts`
- `/home/junior/nuu/src/features/checkout/actions/comissoes-representantes/processar-comissoes-pedido.ts`
- `/home/junior/nuu/src/features/checkout/actions/comissoes-representantes/reconciliar-comissoes-pendentes.ts`
- `/home/junior/nuu/src/features/checkout/actions/pagamentos/confirmar-pagamento-recebido.ts`
- `/home/junior/nuu/src/features/checkout/actions/pedido/criar-pedido-checkout-visitante.ts`
- `/home/junior/nuu/src/features/checkout/actions/pedidos-admin/alterar-status-pedido-admin.ts`
- `/home/junior/nuu/src/features/checkout/components/admin/pedidos/pedido-detalhe-admin-page.tsx`
- `/home/junior/nuu/src/features/checkout/lib/comissoes-representantes/base-comissionavel-item.ts`
- `/home/junior/nuu/src/features/checkout/lib/pagamentos/reconciliar-pagamentos-pendentes.ts`
- `/home/junior/nuu/src/features/checkout/queries/previa-totais/calcular-previa-totais-pedido-interno.ts`
- `/home/junior/nuu/src/features/checkout/testes/comissoes-representantes/base-comissionavel.testes.ts`
- `/home/junior/nuu/src/features/checkout/testes/comissoes-representantes/interface-atribuicao.local.testes.ts`
- `/home/junior/nuu/src/features/checkout/testes/comissoes-representantes/pedidos-comissoes.integracao.testes.ts`
- `/home/junior/nuu/src/features/checkout/testes/comissoes-representantes/validar-interface-atribuicao.ts`
- `/home/junior/nuu/src/features/pagamento-na-entrega/actions/admin/confirmar-recebimento-pagamento-entrega-admin.ts`
- `/home/junior/nuu/src/features/pagamento-na-entrega/actions/admin/registrar-nao-recebimento-pagamento-entrega-admin.ts`
- `/home/junior/nuu/src/features/products/actions/representantes/definir-comissionado-produto.ts`
- `/home/junior/nuu/src/features/products/components/admin/representantes/comissionado-proximas-vendas.tsx`
- `/home/junior/nuu/src/features/products/components/admin/representantes/configurar-comissao-representante.tsx`
- `/home/junior/nuu/src/features/products/queries/representantes/buscar-comissoes-produto-gestor.ts`

## Correção da atribuição — resultado

A 0061 permanece válida e intacta: snapshots, eventos, índices únicos e processamento de pagamento/cancelamento/estorno foram preservados. Foi necessária a migration aditiva **0062_comissionado_unico_produto**, gerada pelo Drizzle, contendo apenas a tabela de escolha única por produto. Aplicação somente local: **62 → 63**, agora **63/63**. Nenhuma escolha foi preenchida por inferência ou copiada de pedidos históricos.

A comparação de hashes de **27 tabelas anteriores**, incluindo snapshots/eventos e todas as colunas comerciais, confirmou zero alterações nos dados existentes e preservação dos **149 produtos**.

Testes de atribuição foram adaptados ao fluxo automático, mantendo as verificações financeiras/eventos já aprovadas: **10 cenários de integração aprovados** (11 registros TAP incluindo agrupador), com captura automática, escolha entre múltiplos autorizados, ausência/remoção, troca para vendas futuras, snapshots antigos preservados, revogação concorrente, endpoint manual bloqueado, idempotência, cálculo, pagamento e cancelamento/estorno. As baterias gerais das Etapas 2–5 não foram repetidas.

Validação focada em navegador **aprovada** em desktop e Android: escolha explícita no produto, estado inicial sem destinatário, remoção da escolha, ausência do botão manual em pedido e ausência de atribuição retroativa. Capturas atualizadas: [produto desktop](prototipos/representante-etapa-6/produto-comissionado-desktop.png) e [produto Android](prototipos/representante-etapa-6/produto-comissionado-android.png). As capturas anteriores do seletor por pedido são históricas e não representam mais a interface vigente.

O delta 0062 foi validado contra 0061, incluindo rejeição de mudanças nos snapshots anteriores. Lint direcionado da correção aprovado sem erros (somente avisos legados de `src/db/schema.ts`). Build local aprovado. Typecheck conclusivo aprovado (`tsc --noEmit --incremental false`, saída 0); entradas temporárias do Next removidas do `tsconfig.json`.

Arquivos principais da correção:

- `src/db/tables/representantes-fornecedores/comissionado-produto.ts` e export em `src/db/schema.ts`;
- `src/features/products/actions/representantes/definir-comissionado-produto.ts`;
- `src/features/products/queries/representantes/buscar-comissoes-produto-gestor.ts`;
- `src/features/products/components/admin/representantes/comissionado-proximas-vendas.tsx` e integração no modal existente;
- `src/features/checkout/actions/comissoes-representantes/capturar-comissoes-checkout.ts` e hook na criação de pedido;
- endpoint manual antigo bloqueado; controle manual removido da tela de pedido;
- consultas, componente, hook, chave e schema exclusivos da atribuição manual removidos;
- `drizzle/0062_comissionado_unico_produto.sql`, snapshot/journal e validadores da cadeia;
- testes de integração/navegador da atribuição e esta documentação.

Processadores de confirmação, cancelamento, estorno e reconciliação da Etapa 6 não precisaram ser alterados nesta correção. O motor da Etapa 5 não foi alterado. Trabalho permanece somente local, sem commit, push ou deploy.
