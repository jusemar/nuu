# Etapa 4 — Operação de produtos pelo representante

## Escopo implementado

Implementação local do protótipo aprovado: identidade do representante com empresa no cabeçalho e menu de conta existente; listagem paginada com busca por nome, SKU e código do fornecedor; edição inline de nome, preço e estoque; cadastro e edição completa; galeria de imagens. Desktop usa linhas com colunas e celular usa cards, os mesmos componentes de interface, navegação móvel e breakpoints do Nooo. Botões de edição têm área de toque de 44 px e não dependem de hover.

A coluna Produto mantém nome, imagem, `sku :` e `Cód. fornecedor:`. Não existem colunas Fornecedor/Modalidade nem bloco Tipo de produto. Empresa única aparece na identificação do usuário; não há seletor nesse caso. Caso existam vários vínculos ativos, o contexto da operação precisa ser escolhido explicitamente entre os fornecedores autorizados.

As abas mantidas são Básico, Preço, Imagens, Peso e dimensões, Garantia e SEO. O SKU continua gerado pelo gerador compartilhado da Nooo e não é editável pelo representante. O código do fornecedor é independente e editável. Categorias e marcas são selecionadas entre registros existentes e ativos. Imagens são adicionadas depois da criação do rascunho.

## Regras efetivas no servidor

- Capacidade RBAC específica, administrador ativo, fornecedor ativo, vínculo ativo e autorização individual do produto são exigidos no servidor. Associação comercial sozinha nunca concede acesso.
- Criação grava produto simples em rascunho, preço `dropshipping`, variante técnica, vínculo comercial e autorização individual do criador em uma única transação. Falha reverte o conjunto.
- Payloads Zod estritos rejeitam SKU, publicação, comissões, atributos, variantes, outras modalidades e campos não autorizados. Produtos legados incompatíveis ou com vínculo comercial ambíguo precisam de revisão do gestor; não são convertidos silenciosamente.
- Inline e edição completa usam versão do produto para impedir sobrescrita de alterações concorrentes. O formulário preserva alterações locais durante consultas em segundo plano.
- Escritas bloqueiam linhas de administrador, fornecedor, vínculo, autorização e produto e conferem novamente o estado efetivo. Revogação/desativação que conclui antes da escrita bloqueia a operação, inclusive galeria. Operações concorrentes são serializadas; a tela aberta não preserva uma autorização revogada.
- Queries filtram o escopo antes de contagem/paginação. Leituras de filhos partem dos produtos autorizados. Valores de comissão oculta viram NULL na seleção SQL e não são enviados ao representante.
- Fluxos globais de exclusão, publicação, duplicação, lote, importação, variantes e gestão de categorias continuam bloqueados ao representante. Foram protegidas também as três actions legadas de categoria que não possuíam guard próprio.
- Comissão percentual/fixa e sua visibilidade são configuradas exclusivamente pelo administrador principal, por autorização individual. Representante apenas lê quando permitido. Não há cálculo de ganhos, comissão de vendas ou histórico.
- Alterações bem-sucedidas são auditadas com ator, produto, fornecedor e ação, sem senhas/credenciais.

O label da modalidade é “Fornecedor” no representante, gestor e pontos pertinentes da loja. A chave interna permanece `dropshipping`; algoritmos de precificação/checkout não foram alterados.

## Estoque, imagens e publicação

Estoque do fornecedor é informação comercial em `fornecedor_produto_vinculos.estoque_informado_fornecedor`. Não altera `product_variant.stock_quantity`, reserva, alocação ou disponibilidade física da Nooo. Produto novo não ganha modalidade Estoque próprio.

Upload valida sessão, autorização do produto, tipo real JPEG/PNG/WebP, tamanho de até 4 MB e limite de 20 imagens. O limite cabe no corpo de Server Actions já configurado. Remoção, ordenação e principal exigem que a imagem pertença ao produto autorizado. Remover vínculo de galeria não apaga objetos compartilhados.

No desenvolvimento com banco local, imagens ficam em `/tmp/nooo-imagens-representantes`, servidas por endpoint local autenticado e sem cache público; nenhum Blob remoto é utilizado nos testes. Esse armazenamento é temporário e não representa armazenamento definitivo de produção. Fora desse modo local, o adaptador utiliza o Blob já adotado pelo projeto; esse caminho remoto não foi executado nesta etapa.

Publicação e configuração logística permanecem com o gestor nos fluxos existentes. Rascunhos novos não recebem configuração de entrega automaticamente. Não há Jaaa, logística específica ou Etapa 5.

## Banco e preservação de dados

Migration Drizzle gerada: `0059_operacao_produtos_representantes`.

1. Acrescenta estoque informado do fornecedor, default zero e CHECK não negativo.
2. Acrescenta tipo/valor/visibilidade de comissão à autorização individual, com defaults ocultos e CHECK coerente para percentual, valor fixo ou configuração vazia.
3. Atualiza snapshot, journal e validação do delta permitido. Nenhuma migration anterior foi reescrita.

Validação descartável: atualização **59 → 60**, cadeia vazia **0 → 60**, estruturas finais idênticas e reaplicação sem efeitos adicionais. Aplicação somente no PostgreSQL persistente existente `nooo-postgres-local`: **60/60**.

Comparação antes/depois por contagem e hash dos registros em 25 tabelas: **zero diferenças nos dados anteriores**, desconsideradas somente as novas colunas. Preservados os **149 produtos**. Nenhuma conta real, senha, vínculo ou permissão foi criada ou alterada para validar a interface. Usuários de ensaio e credenciais fictícias existiram somente em containers descartáveis.

## Validação

### Evidências preservadas da execução anterior à interrupção

- **12 testes de escrita/segurança aprovados**: criação atômica, rollback, payload estrito, IDOR, edição completa/inline, concorrência de versão, estruturas incompatíveis, categorias, comissão, imagens, revogação concorrente de autorização/vínculo/fornecedor e preservação do fluxo do gestor.
- **2 testes da cadeia de migrations aprovados**, incluindo rejeição de delta não permitido.
- Validação de migrations descartável e preservação dos dados locais aprovadas, conforme seção anterior.
- Regressões de cálculo de preços/vitrine, totais e label de conciliação aprovadas. As primeiras tentativas de carregar testes legados sem ambiente fictício completo foram recusadas pelas guardas de ambiente/variáveis obrigatórias, antes de consultas; corrigida somente a configuração do processo de teste.
- **Lint da nova área de representantes aprovado**, sem erros ou avisos. O lint global permanece reprovado por dívida de arquivos existentes; não foi feito autofix global. A ordenação dos imports dos novos componentes foi corrigida após essa execução.
- **Navegador real aprovado** em desktop 1440 × 1000 e Android Pixel 7 393 × 851 com toque: login real de fixture local, identidade com empresa/menu Sair, listagem, edição de nome/preço/estoque, edição completa, cadastro com SKU automático e código próprio, imagens autenticadas, todas as abas, comissão percentual/fixa/oculta e erro de acesso após revogação. Nenhum erro JavaScript ou overflow horizontal da página. A barra de abas tem rolagem própria em telas pequenas.
- Revisão das capturas confirmou o preço em reais, nome, SKU e código distintos, comissão somente leitura e apresentação por cards no celular.

Capturas: [desktop](prototipos/representante-etapa-4/implementacao/lista-desktop.png), [imagens](prototipos/representante-etapa-4/implementacao/imagens-desktop.png), [comissão oculta](prototipos/representante-etapa-4/implementacao/comissao-oculta-desktop.png), [lista Android](prototipos/representante-etapa-4/implementacao/lista-android.png), [cadastro Android](prototipos/representante-etapa-4/implementacao/cadastro-android.png), [edição Android](prototipos/representante-etapa-4/implementacao/edicao-android.png).

### Continuação após interrupção

Arquivos, logs e capturas foram conferidos antes de continuar. Nenhuma implementação, auditoria de segurança, migration ou teste aprovado foi repetido. Ficaram pendentes somente build, confirmação conclusiva do typecheck, limpeza da configuração temporária gerada pelo Next e fechamento deste relatório. A alteração posterior no auxiliar de teste foi somente formatação.

- **Build local aprovado** (`npm run build`) com diretório de saída isolado `.next/etapa4-build`, ambiente de homologação e URL validada pela guarda do PostgreSQL local. A verificação de schema remoto foi ignorada fora da Vercel de produção. Houve uma tentativa de reconexão durante a compilação, sem impedir sua conclusão.
- `tsconfig.json` restaurado ao conteúdo exato anterior à Etapa 4, removendo apenas as entradas automáticas dos diretórios temporários do Next.
- `git diff --check` aprovado.
- **Typecheck conclusivo aprovado** (`tsc --noEmit --incremental false`, saída 0). Foi concluído nesta retomada porque o log anterior não preservava confirmação de término após a interrupção.

Não foram repetidos os testes funcionais, de segurança, de migrations, de preços, de totais, de lint ou de navegador já aprovados.

## Situação de entrega

Etapa 4 concluída e validada localmente, sem pendência funcional identificada no escopo. O lint global ainda contém erros legados fora da nova área. O armazenamento remoto não foi exercitado: testes de imagens utilizaram exclusivamente o adaptador local.

Código e migration permanecem locais, sem commit, push ou deploy e sem acesso a produção. Para utilização no ambiente publicado será necessário autorizar separadamente a aplicação das migrations pendentes e o deploy. Não foi feito provisionamento automático de representantes em contas existentes.

## Inventário dos arquivos desta etapa

Comparação com o retrato anterior à Etapa 4, preservando alterações anteriores das Etapas 2 e 3. Caminhos completos:

- `/home/junior/nuu/docs/prototipos/representante-etapa-4/implementacao/cadastro-android.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-4/implementacao/comissao-oculta-desktop.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-4/implementacao/edicao-android.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-4/implementacao/imagens-desktop.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-4/implementacao/lista-android.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-4/implementacao/lista-desktop.png`
- `/home/junior/nuu/docs/representantes-fornecedores-etapa-4-wireframe.md`
- `/home/junior/nuu/docs/representantes-fornecedores-etapa-4.md`
- `/home/junior/nuu/drizzle/0059_operacao_produtos_representantes.sql`
- `/home/junior/nuu/drizzle/meta/0059_snapshot.json`
- `/home/junior/nuu/drizzle/meta/_journal.json`
- `/home/junior/nuu/next.config.ts`
- `/home/junior/nuu/package.json`
- `/home/junior/nuu/scripts/lib/validar-cadeia-migrations.testes.ts`
- `/home/junior/nuu/scripts/lib/validar-cadeia-migrations.ts`
- `/home/junior/nuu/scripts/validar-e-aplicar-migrations.ts`
- `/home/junior/nuu/src/actions/admin/categories/create.ts`
- `/home/junior/nuu/src/actions/admin/categories/delete.ts`
- `/home/junior/nuu/src/actions/admin/categories/update.ts`
- `/home/junior/nuu/src/app/admin/layout.tsx`
- `/home/junior/nuu/src/app/admin/products/layout.tsx`
- `/home/junior/nuu/src/app/admin/products/new/components/tabs/PricingTab.tsx`
- `/home/junior/nuu/src/app/admin/products/page.tsx`
- `/home/junior/nuu/src/app/api/imagens-representante-local/[imagemId]/route.ts`
- `/home/junior/nuu/src/components/admin/header.tsx`
- `/home/junior/nuu/src/db/tables/fornecedores/tabelas/fornecedor-produto-vinculos.ts`
- `/home/junior/nuu/src/db/tables/representantes-fornecedores/tabelas.ts`
- `/home/junior/nuu/src/features/admin/layout/components/sidebar.tsx`
- `/home/junior/nuu/src/features/carrinho/components/store/gaveta-carrinho/item-carrinho.tsx`
- `/home/junior/nuu/src/features/checkout/queries/resumo-checkout/calcular-resumo-checkout.ts`
- `/home/junior/nuu/src/features/fornecedores/components/admin/aba-conciliacao-importacao-fornecedor.tsx`
- `/home/junior/nuu/src/features/fornecedores/components/admin/tabela-conciliacao-fornecedor.tsx`
- `/home/junior/nuu/src/features/fornecedores/components/admin/tabela-mapeamento-campos-fornecedor.tsx`
- `/home/junior/nuu/src/features/fornecedores/lib/conciliacao/comparativo-conciliacao-fornecedor.testes.ts`
- `/home/junior/nuu/src/features/fornecedores/lib/conciliacao/comparativo-conciliacao-fornecedor.ts`
- `/home/junior/nuu/src/features/precificacao/constants/rotulo-fornecedor.ts`
- `/home/junior/nuu/src/features/products/actions/representantes/armazenar-imagem-produto.ts`
- `/home/junior/nuu/src/features/products/actions/representantes/configurar-comissao-gestor.ts`
- `/home/junior/nuu/src/features/products/actions/representantes/consultar-produtos-representante.ts`
- `/home/junior/nuu/src/features/products/actions/representantes/criar-produto-representante.ts`
- `/home/junior/nuu/src/features/products/actions/representantes/editar-campo-produto-representante.ts`
- `/home/junior/nuu/src/features/products/actions/representantes/editar-produto-representante.ts`
- `/home/junior/nuu/src/features/products/actions/representantes/executar-escrita-representante.ts`
- `/home/junior/nuu/src/features/products/actions/representantes/gerenciar-imagens-representante.ts`
- `/home/junior/nuu/src/features/products/actions/representantes/persistir-produto-representante.ts`
- `/home/junior/nuu/src/features/products/actions/representantes/responder-operacao-produto.ts`
- `/home/junior/nuu/src/features/products/components/admin/representantes/abas-formulario-produto-representante.tsx`
- `/home/junior/nuu/src/features/products/components/admin/representantes/campos-formulario-representante.tsx`
- `/home/junior/nuu/src/features/products/components/admin/representantes/configurar-comissao-representante.tsx`
- `/home/junior/nuu/src/features/products/components/admin/representantes/editar-campo-inline.tsx`
- `/home/junior/nuu/src/features/products/components/admin/representantes/formulario-produto-representante.tsx`
- `/home/junior/nuu/src/features/products/components/admin/representantes/galeria-produto-representante.tsx`
- `/home/junior/nuu/src/features/products/components/admin/representantes/linha-produto-representante.tsx`
- `/home/junior/nuu/src/features/products/components/admin/representantes/listagem-produtos-representante.tsx`
- `/home/junior/nuu/src/features/products/components/admin/representantes/rotas-produtos-representante.tsx`
- `/home/junior/nuu/src/features/products/constants/modalidades-preco.ts`
- `/home/junior/nuu/src/features/products/constants/representantes/query-keys.ts`
- `/home/junior/nuu/src/features/products/hooks/representantes/use-formulario-produto-representante.ts`
- `/home/junior/nuu/src/features/products/hooks/representantes/use-produtos-representante.ts`
- `/home/junior/nuu/src/features/products/lib/representantes/validar-estrutura-produto-representante.ts`
- `/home/junior/nuu/src/features/products/queries/representantes/buscar-comissoes-produto-gestor.ts`
- `/home/junior/nuu/src/features/products/queries/representantes/buscar-formulario-representante.ts`
- `/home/junior/nuu/src/features/products/queries/representantes/buscar-perfil-produtos-admin.ts`
- `/home/junior/nuu/src/features/products/queries/representantes/listar-produtos-representante.ts`
- `/home/junior/nuu/src/features/products/schemas/representantes/produto-representante.schema.ts`
- `/home/junior/nuu/src/features/products/testes/representantes/escrita-produtos.integracao.testes.ts`
- `/home/junior/nuu/src/features/products/testes/representantes/interface-produtos.local.testes.ts`
- `/home/junior/nuu/src/features/products/testes/representantes/validar-interface-representante.ts`
- `/home/junior/nuu/src/features/products/types/representantes/produto-representante.types.ts`
- `/home/junior/nuu/src/features/promocoes/components/admin/pagina-promocoes-admin.tsx`
- `/home/junior/nuu/src/features/store/products/components/PricingModalities/index.tsx`
- `/home/junior/nuu/src/features/store/products/components/ProductDetailsPage.tsx`
- `/home/junior/nuu/src/features/store/products/constants/mockData.ts`
