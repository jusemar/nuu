# Logística de produtos de representantes — auditoria local

## Evidências

Inspeção somente no PostgreSQL local persistente, validado pelo lançador oficial.
Produto `ACE-GENE-993` (`1315386a-6e7c-4e2c-8542-5cfccf9bb90e`), do
Fornecedor Teste Representante: peso 5.000 g, altura/largura/comprimento 20 cm,
estoque informado 7, vínculo comercial ativo e código `FORN-CRIADO-REP`.
Está ativo, porém em `draft`, com `allowed_delivery_types=[]`,
`allows_supplier_delivery=false` e `allows_pickup=false`.

O cadastro do representante define explicitamente esses valores em
`src/features/products/actions/representantes/criar-produto-representante.ts`.
Sua edição altera dimensões e dados comerciais, mas não autoriza expedição nem
publicação. Não há associação incorreta com o fornecedor neste produto.

## Origem de envio existente

- `validarLogisticaProduto` gera `ORIGEM_ENVIO_AUSENTE` quando não há tipo de
  entrega nem retirada exclusiva. O alerta não é uma consulta a endereço.
- `diagnosticarLogisticaProduto` combina essa regra com a especialização Laquila.
  `listarDiagnosticosLogisticosProdutos` carrega produtos/vínculos em lote e é
  usado pelo gestor. O formulário do representante não recebe esse diagnóstico.
- A tela administrativa de edição contém a aba Entrega. Ali existem Entrega
  Própria, Retirada Local e Frete Externo; a configuração explícita de expedição
  pelo fornecedor é específica da Laquila. Não existe formulário de origem de
  expedição de fornecedor genérico.
- `fornecedores` não possui campos de endereço/CEP de expedição. A inspeção do
  schema local não encontrou esses campos nas tabelas de fornecedores. O
  fornecedor de teste não tem integração API cadastrada.
- `dropshipping` é modalidade comercial, não atribui origem física. O checkout
  resolve provedores por vínculos ativos com integração; sem provedor, o
  resolvedor atual retorna origem `loja`. Na PDP a identificação específica de
  fornecedor é Laquila. Por isso simplesmente gravar `supplier` não constitui
  correção completa para um fornecedor sem integração.
- O CEP da loja vem de `FRENET_CEP_ORIGEM`. O da Laquila vem exclusivamente de
  `LAQUILA_CEP_ORIGEM`, sem fallback para a loja. Grupos de expedição separam essas
  origens. Não foram lidos nem publicados segredos dos provedores nesta auditoria.

## Publicação

O representante cria rascunho. A action `publicarProdutoAdmin` exige as
permissões `PRODUTOS.ADMINISTRAR` e `PRODUTOS.PUBLICAR`; o representante não ganha
essas permissões. Publicação também valida dados logísticos. Publicação e
elegibilidade logística são eixos distintos; corrigir peso não publica o produto.
Não há motivo para criar novos estados no banco.

## Limite da correção e decisão pendente

Não foi autorizada automaticamente nenhuma origem, endereço ou integração.
Não se deve habilitar `own`, reaproveitar CEP da Nooo ou fabricar uma integração
Laquila para remover artificialmente o alerta do fornecedor de teste.
Foi solicitada decisão sobre ampliar a logística existente para origem genérica
autorizada pelo gestor e sobre a fonte dos dados locais de expedição válidos.

Antes de integrar novas informações na tela, a regra 6 de `regras.md` exige
aprovação visual. A prévia sem persistência está em
`http://localhost:3000/test/diagnostico-logistico-representante`.
Ela reutiliza o componente e a função de diagnóstico existentes; inclui rascunho,
pendências de dimensões/origem e publicação independente da logística. O estado
simulado sem pendências não comprova cotação, estoque, compra ou venda real.

As validações reais de configuração da origem, desaparecimento da pendência e
venda permanecem pendentes; não devem ser declaradas aprovadas nesta fase.

## Prévia e verificações executadas

- Chromium real: quatro estados simulados interativos em desktop 1440 × 1000
  e Android Pixel 7, incluindo abertura da seção de dimensões; sem overflow ou
  erros JavaScript. Origens externas bloqueadas no navegador.
- Capturas: `docs/prototipos/diagnostico-logistico-representante/desktop.png` e
  `android.png`.
- Nove casos unitários existentes de validação/diagnóstico aprovados.
- Typecheck (`tsc --noEmit`) e ESLint direcionado: aprovados.
- Build local: aprovado, com geração das rotas concluída.
- Não houve escrita de dados, migrations ou mudança de permissões nesta tarefa.

Arquivos da prévia: `src/app/test/diagnostico-logistico-representante/page.tsx`,
`src/features/logistica/components/admin/previsualizacao-diagnostico-representante.tsx`.
O componente existente
`src/features/logistica/components/admin/alerta-diagnostico-logistico-produto.tsx`
recebeu apenas uma área opcional de orientações, sem alterar a validação ou o
comportamento das telas que já o usam.
