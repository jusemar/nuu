# Etapa 5 — Precificação e motor de comissão dos representantes

## Implementação

A Etapa 5 mantém o fluxo de preços e os guards transacionais da Etapa 4. Representante continua restrito a produto simples autorizado, modalidade interna `dropshipping` e label “Fornecedor”. Não pode alterar custo interno, outras modalidades, publicação ou configuração global. Autorização, vínculo, fornecedor e versão são conferidos no momento da gravação; a revogação concorrente impede a escrita que aguardava o lock.

Foi consolidado um contrato Zod estrito de configuração e cálculo, um motor puro reutilizável, a criação de snapshot imutável e um adaptador interno protegido para preparar uma regra explicitamente atribuída. O checkout não chama esses serviços nesta etapa.

## Modelo da comissão

A configuração continua na relação individual `autorizacoes_produtos_representantes`, sem criar um segundo sistema. Seus campos são:

- `comissao_tipo`: `percentual` ou `fixa`, ou NULL quando não configurada;
- `comissao_valor`: inteiro em pontos-base no percentual (10000 = 100%; 125 = 1,25%) ou centavos no valor fixo;
- `comissao_ativa`: independente da autorização de edição e da visibilidade;
- `comissao_visivel`: controla exclusivamente o que pode ser mostrado ao representante.

Somente o gestor principal existente pode configurar. A action repete a validação de administrador principal ativo sob lock na transação. Há auditoria administrativa de sucesso com ator, produto e fornecedor. Ativação exige configuração válida. Percentual fica entre 0 e 10000 pontos-base; valor fixo fica entre 0 e 2147483647 centavos, conforme a coluna financeira existente.

Autorizar edição **não concede** direito à comissão. Ativar uma configuração também **não atribui** automaticamente uma venda: é obrigatória uma atribuição explícita contendo representante, vínculo, fornecedor, produto e autorização individual. Não há seleção do primeiro representante nem distribuição para todos.

A visibilidade não determina a elegibilidade: uma regra pode estar ativa e oculta. A listagem mantém a proteção SQL da Etapa 4: tipo e valor ocultos não são enviados ao representante. O estado de ativação é consultado somente pelo gestor/adaptador interno. O representante continua vendo apenas a configuração que o gestor permitiu, sem promessa de ganho ou ação de edição.

## Cálculo e precisão

O motor recebe atribuição, regra correspondente e os dados efetivos do item vendido: quantidade, preço unitário vendido, desconto total aplicado ao item e valor líquido total do item. Não consulta o preço atual do catálogo.

- Percentual: `arredondar(valor líquido do item em centavos × pontos-base / 10000)`.
- Fixa: `valor fixo em centavos × quantidade`.
- Arredondamento percentual por item: centavo mais próximo, meio centavo para cima.
- Todas as entradas monetárias são inteiros seguros; operações intermediárias usam BigInt e o resultado só volta a Number se continuar inteiro seguro. Não há float no cálculo monetário.
- A entrada decimal da configuração é convertida por dígitos para centavos/pontos-base, também sem multiplicação float.
- O valor líquido informado deve corresponder exatamente a `preço unitário vendido × quantidade − desconto do item`.
- Frete e taxa de pagamento não pertencem ao contrato; campos extras são rejeitados.

Desconto deve ser o valor já atribuído àquele item, inclusive eventual rateio de desconto do pedido. O serviço não inventa rateios. A comissão fixa segue a fórmula solicitada, sem criar teto implícito pelo valor líquido do item. Configuração inativa ou IDs incompatíveis são rejeitados, em vez de produzir um ganho silencioso.

## Snapshot e integração futura

O contrato de snapshot versão 1 copia e congela atribuição, quantidade, preço vendido, desconto, líquido, ID/versão da regra, tipo/valor, comissão calculada, momento da venda e critério de arredondamento. É serializável em JSON; BigInt não sai do cálculo. Alterar a regra ou o preço posteriormente não modifica esse objeto.

`criarSnapshotComissaoRepresentante` é puro e aceita a regra capturada explicitamente. Sem atribuição retorna NULL, sem consultar ou escolher representantes.

`prepararSnapshotComissaoAtribuida` é um adaptador **server-only**, protegido pelo gestor principal, sem Server Action ou endpoint. Ele valida a atribuição exata, fornecedor/vínculo/autorização ativos, comissão ativa e estrutura simples/Fornecedor, sob locks de leitura. Não consulta vários representantes para decidir quem recebe. Impede usar a configuração atual para reconstruir venda anterior à versão da regra. O cálculo puro pode consumir o snapshot original da regra histórica.

Ainda não há origem determinística de representante nos pedidos. Por isso, nenhum pedido gera comissão automaticamente e nenhuma tabela de lançamentos financeiros foi criada. A futura integração terá que fornecer atribuição confiável, persistir o snapshot junto ao evento/item com imutabilidade e idempotência e definir o ator do sistema; o adaptador atual exige gestor e não pode ser reutilizado como endpoint público de checkout.

## Cancelamento, estorno e devolução

Foram lidos somente os enums e a decisão de cancelamento necessários: pedidos `pending`, `paid`, `processing`, `shipped`, `delivered`, `canceled`, `refunded`, `expired` e `pagamento_recebido_sem_recursos`; pagamentos existentes; estados de reembolso e decisão `orientar_devolucao` para enviados/entregues.

O auxiliar puro prepara efeitos futuros: aguardar, avaliar venda válida, anular por cancelamento/estorno ou revisar devolução/situações pendentes. São resultados de decisão interna, **não novos status de pedido**. Não alteram pedido, pagamento, snapshot, saldo ou qualquer lançamento. Pedido pago é candidato à avaliação, não autorização automática de pagamento de comissão.

Na integração futura, cancelamento/estorno deverá gerar ajuste idempotente vinculado ao snapshot original, sem reescrevê-lo. Devolução ou estorno parcial precisará identificar item/quantidade/valor efetivo para o ajuste; não foi inventado um rateio financeiro nesta etapa.

## Interface

Foi reaproveitado o modal de comissão do gestor da Etapa 4, adicionando o controle “Comissão ativa”. A configuração permanece específica por autorização. A listagem do representante segue a ordem pedida nesta etapa: **Produto | Preço | Comissão | Estoque | Situação | Ação**, omitindo a comissão quando oculta. Cards, inline por toque, identidade/empresa, SKU, código do fornecedor e demais telas foram preservados. Nenhum dashboard, “Você ganha”, histórico, saldo ou pagamento foi criado.

## Migration e dados locais

A 0059 já tinha tipo, valor e visibilidade. Foi necessária a migration oficial **0060_ativacao_comissao_representante**, gerada pelo Drizzle, para separar ativação de autorização/visibilidade sem apagar a configuração existente.

Ela acrescenta somente `comissao_ativa NOT NULL DEFAULT false` e CHECK que exige tipo/valor quando ativa. A cadeia/snapshot e a validação de delta foram atualizados. Nenhuma migration anterior foi editada.

Aplicação exclusivamente no `nooo-postgres-local`: **60 → 61**, agora **61/61**. Configurações anteriores não foram ativadas automaticamente. Comparação de contagem/hash de 25 tabelas antes/depois: zero diferenças nos dados anteriores, ignorada apenas a nova coluna. **149 produtos preservados**. Testes de escrita e navegador utilizam somente fixtures em PostgreSQL Docker descartável; nenhuma conta real recebeu nova permissão/configuração.

## Validação

- Motor: **19 testes puros aprovados**, cobrindo percentual, fixa, quantidade, zero, 100%, inválidos, centavos, desconto, arredondamento, overflow, identidade explícita, congelamento, múltiplos representantes, conversão decimal e efeitos futuros de pedido.
- Integração específica: **6 cenários aprovados** (7 registros TAP incluindo o agrupador), cobrindo delta 0060, configuração exclusiva do gestor, ocultação de payload, atribuição/snapshot, escrita de preço e revogação concorrente/inativação.
- Validação do delta: 0060 válida aprovada e alteração indevida de tabela anterior rejeitada.
- Navegador focado **aprovado**: gestor configura ativação/visibilidade, valor persistido conferido no banco descartável, ocultação na listagem, ordem das colunas no desktop e comissão somente leitura no Android Pixel 7 (393 × 851), sem overflow e sem erros JavaScript. Foram corrigidas premissas do roteiro sobre o fechamento do modal após revalidação; nenhuma mudança de regra foi necessária por isso.
- Capturas: [gestor desktop](prototipos/representante-etapa-5/configuracao-gestor-desktop.png) e [representante Android](prototipos/representante-etapa-5/comissao-representante-android.png).
- `npm run lint -- --file ...` **aprovado**, sem erros ou avisos em todos os arquivos TypeScript alterados/criados nesta etapa. Não foi repetido o lint global com dívida já conhecida fora deste escopo.
- `npm run build` **aprovado**, compilação otimizada e geração de 91 páginas. Executado pelo lançador oficial com destino PostgreSQL local validado, configurações fictícias de provedores e saída isolada `.next/etapa5-build`. Nenhum banco remoto foi consultado pela verificação de schema.
- Entradas temporárias adicionadas pelo Next ao `tsconfig.json` removidas, restaurando o conteúdo exato anterior à etapa.
- `git diff --check` aprovado.
- `tsc --noEmit --incremental false` **aprovado**, saída 0 na validação conclusiva.
- As suítes gerais aprovadas nas Etapas 2–4 não foram repetidas.

## Limites da entrega

Etapa 5 concluída e validada localmente, sem pendência funcional identificada neste escopo. Atribuição determinística no pedido, persistência/idempotência de snapshots e ajustes financeiros por eventos permanecem como trabalho futuro, sem iniciar a Etapa 6.

Trabalho somente local. Sem produção/Neon, commit, push, deploy, integração Jaaa, logística específica ou marketplace. Não existe pagamento ou geração automática de comissão de venda.

## Arquivos criados/alterados nesta etapa

- `/home/junior/nuu/docs/prototipos/representante-etapa-5/comissao-representante-android.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-5/configuracao-gestor-desktop.png`
- `/home/junior/nuu/docs/representantes-fornecedores-etapa-5.md`
- `/home/junior/nuu/drizzle/0060_ativacao_comissao_representante.sql`
- `/home/junior/nuu/drizzle/meta/0060_snapshot.json`
- `/home/junior/nuu/drizzle/meta/_journal.json`
- `/home/junior/nuu/scripts/lib/validar-cadeia-migrations.testes.ts`
- `/home/junior/nuu/scripts/lib/validar-cadeia-migrations.ts`
- `/home/junior/nuu/scripts/validar-e-aplicar-migrations.ts`
- `/home/junior/nuu/src/db/tables/representantes-fornecedores/tabelas.ts`
- `/home/junior/nuu/src/features/products/actions/representantes/configurar-comissao-gestor.ts`
- `/home/junior/nuu/src/features/products/components/admin/representantes/configurar-comissao-representante.tsx`
- `/home/junior/nuu/src/features/products/components/admin/representantes/linha-produto-representante.tsx`
- `/home/junior/nuu/src/features/products/components/admin/representantes/listagem-produtos-representante.tsx`
- `/home/junior/nuu/src/features/products/lib/comissoes-representantes/avaliar-efeito-pedido-comissao.ts`
- `/home/junior/nuu/src/features/products/lib/comissoes-representantes/calcular-comissao-representante.ts`
- `/home/junior/nuu/src/features/products/lib/comissoes-representantes/converter-valor-comissao.ts`
- `/home/junior/nuu/src/features/products/lib/comissoes-representantes/criar-snapshot-comissao-representante.ts`
- `/home/junior/nuu/src/features/products/queries/representantes/buscar-comissoes-produto-gestor.ts`
- `/home/junior/nuu/src/features/products/queries/representantes/preparar-snapshot-comissao-atribuida.ts`
- `/home/junior/nuu/src/features/products/schemas/comissoes-representantes/comissao-representante.schema.ts`
- `/home/junior/nuu/src/features/products/testes/comissoes-representantes/comissao-preco.integracao.testes.ts`
- `/home/junior/nuu/src/features/products/testes/comissoes-representantes/interface-comissao.local.testes.ts`
- `/home/junior/nuu/src/features/products/testes/comissoes-representantes/motor-comissao.testes.ts`
- `/home/junior/nuu/src/features/products/testes/comissoes-representantes/validar-interface-comissao.ts`
- `/home/junior/nuu/src/features/products/types/comissoes-representantes/comissao-representante.types.ts`
