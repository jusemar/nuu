# Etapa 4 — Wireframe para aprovação

Preparação local sobre as Etapas 2 e 3, em 28/10/2026. A regra de produto simples e modalidade interna `dropshipping` / label **Fornecedor** já foi definida pelo usuário. Este documento registra somente a proposta de interface e a leitura pontual exigida do cadastro; não declara a Etapa 4 implementada.

## Prévia

Abra [o wireframe interativo](prototipos/representante-etapa-4/index.html) no navegador. Dados fictícios, sem requisições ou gravações. Botão Novo produto, edição, abas, pesquisa e filtro são navegáveis.

- Lista: produtos autorizados, busca, filtro de fornecedor e ação Editar. Sem seleção em lote, exclusão, duplicação ou importação.
- Cadastro: fornecedor obrigatório, sem seleção automática mesmo em uma lista com vários vínculos; produto simples fixo; categorias e marcas existentes selecionáveis.
- Edição: abas Básico, Preços, Imagens, Peso e dimensões, Garantia e SEO. Sem variantes, criação de categorias, recompensas, promoções ou configurações globais de entrega.
- Preço: somente **Fornecedor**; preço de venda e descrição do prazo/disponibilidade. Sem estoque físico da Nooo. Identificador interno permanece `dropshipping`.
- Criação: salvar rascunho primeiro; com produto e autorização criados, disponibilizar a galeria. Evita upload administrativo sem produto pai autorizado.
- Imagens: seleção e remoção simuladas somente na edição. A integração reutilizará a galeria e o upload existentes, protegendo produto e operação no servidor.
- Publicação continua reservada ao gestor. Produtos já publicados podem ter seus campos permitidos editados, sem alterar automaticamente sua situação.
- Revogação: estado com mensagem de acesso revogado e alterações não salvas. A recusa real será sempre no servidor.
- Sem painel independente: mantém navegação e estrutura do admin, exibindo somente as funções pertinentes ao representante.

O HTML é um artefato de revisão visual. A implementação usará os componentes shadcn, os tokens e os formulários adotados no projeto; ele não será incorporado como aplicação paralela.

## Leitura pontual do cadastro atual

Arquivos verificados: `src/actions/admin/products/create.ts`, `src/actions/admin/products/update.ts`, páginas de criação/edição e abas existentes, tabelas de representantes e relatório da Etapa 3.

O cadastro legado exige permissão global, escreve produto, galeria, modalidades e variante técnica em chamadas sucessivas, e tenta remover o produto se ocorre falha. Não cria, por esse caminho, o vínculo comercial e a autorização individual da Etapa 2 numa transação única. A edição também é ampla e pressupõe permissão global. Portanto, retirar o guard global não atende ao pedido.

Produto simples utiliza uma variante técnica para compatibilidade com catálogo e checkout. O representante não terá operações de variantes; a estrutura técnica necessária será mantida internamente, sem introduzir estoque físico para `dropshipping`.

Após a aprovação visual, a integração deverá:

1. Reusar a capacidade específica de administração, sem liberar capacidades globais ao representante.
2. Validar payload estrito do domínio: produto simples, somente `dropshipping`, fornecedor identificado, categoria existente e campos expressamente permitidos; rejeitar modalidades, variantes e campos administrativos proibidos.
3. Criar produto, preço, estrutura técnica, associação comercial e autorização individual explícita do criador na mesma transação. Não derivar autorização da associação comercial.
4. Validar e bloquear as linhas de fornecedor, vínculo, autorização e produto durante as gravações, incluindo uploads e galeria, para serializar com revogação/desativação. Conferir o estado novamente dentro da transação efetiva.
5. Manter o caminho atual do gestor e bloquear edição de estrutura incompatível pelo representante; não converter produtos multimodais ou variáveis silenciosamente.
6. Disponibilizar queries auxiliares mínimas de categorias/marcas e o acesso às rotas de produtos, sem liberar CRUD desses domínios nem o restante do painel.
7. Trocar somente os labels pertinentes de `dropshipping` para Fornecedor em representante, gestor e cliente, preservando IDs e regras de checkout.
8. Acrescentar testes específicos de escrita, IDOR, criação atômica, variantes/modalidades proibidas, categorias, imagens e revogação concorrente. Não repetir suites anteriores sem regressão causada pela mudança.

## Estado nesta preparação

Somente wireframe/documentação criados; nenhum código de negócio, schema, migration ou dado alterado. Nenhum acesso a produção, commit, push ou deploy. A implementação de escrita aguarda aprovação visual conforme `regras.md`, item 6. A Etapa 5 não foi iniciada.

## Validação do wireframe

Playwright local aprovado: navegação entre lista/cadastro/edição e abas; fornecedor vazio ao iniciar cadastro; preservação da seleção explícita; galeria bloqueada antes do rascunho e habilitada após o salvamento simulado; label Fornecedor; salvamento desabilitado no estado de revogação; ausência de overflow em 390 px; modo escuro; ausência de erros JavaScript. Quatro capturas foram geradas: [lista](prototipos/representante-etapa-4/lista-desktop.png), [edição](prototipos/representante-etapa-4/edicao-desktop.png), [preço](prototipos/representante-etapa-4/preco-desktop.png) e [cadastro móvel](prototipos/representante-etapa-4/cadastro-mobile.png). `git diff --check` passou.

Não foram repetidos testes de domínio das etapas anteriores. Typecheck/build da aplicação não se aplicam a esta preparação exclusivamente documental e HTML isolado; serão necessários ao integrar a funcionalidade.


## Evolução após aprovação visual

O estado de preparação acima é histórico. A implementação real autorizada e suas validações estão no [relatório técnico da Etapa 4](representantes-fornecedores-etapa-4.md). O HTML aprovado foi preservado.
