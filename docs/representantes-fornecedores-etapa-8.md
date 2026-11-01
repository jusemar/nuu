# Etapa 8 — Atendimento Nooo ↔ Jaaa

## Entrega e arquitetura

Integração real implementada somente localmente, após aprovação da revisão visual. Nooo continua responsável por catálogo, autorização, escolha do atendente, pedidos e comissões; Jaaa continua responsável por identidade pública, autenticação e conversas. Não há compartilhamento de banco, usuários duplicados, credenciais Jaaa, mensagens ou chat dentro da Nooo.

A comunicação usa exclusivamente o contrato web público documentado localmente no Jaaa: `https://jaaa.com.br/@usuario`. Não foi usado endpoint privado de conversa nem inventado parâmetro de contexto. Não existe SSO: a sessão do Jaaa continua independente.

Código no domínio `features/fornecedores`, com `queries/jaaa` para leitura e resolução, `actions/jaaa` para escrita/adaptação de leitura, `schemas/jaaa` para validação, `lib/jaaa` para o contrato puro do endereço, `hooks/jaaa` e `constants/jaaa` para TanStack Query, e componentes administrativos, públicos e compartilhados. Rotas apenas conectam esses módulos. O motor de comissão, a seleção do comissionado no produto, checkout, snapshots e eventos das Etapas 5–7 não foram modificados.

## Contrato Jaaa consultado

Auditoria restrita, somente leitura, no repositório local `/home/junior/jaa`:

- `CLAUDE.md`, seção “Link do Jaa, visitante e perfil público (Web)”.
- `apps/web/src/app/[identificador]/page.tsx`.
- `apps/web/src/features/link/lib/link-do-jaa.ts`.
- `packages/contratos/src/identidades/identidade-pessoal.ts`.

O contrato define um nome público único entre pessoas e empresas, atualmente sem rota de alteração, e o caminho `/@usuario`. Normalização: trim, retirada de um @ inicial, NFKC e minúsculas. Formato canônico `^[a-z][a-z0-9_]{2,29}$`. O contrato de referência permite referenciar nomes reservados já existentes; não se trata de cadastro de identidade no Jaaa.

Sem contrato de contexto externo no link, nenhum produto, SKU, pedido, cliente ou informação financeira é enviado. Não foi criada integração nativa de aplicativo. O domínio indicado pelo usuário é uma constante controlada pela aplicação, nunca uma URL livre digitada pelo gestor. O projeto Jaaa não foi alterado e o domínio remoto não foi consultado.

## Identidade e configuração administrativa

A tabela `identidades_jaaa_representantes` vincula explicitamente um usuário Nooo já ligado a fornecedor a um nome público Jaaa, com ativação, usuário responsável e datas. Há no máximo uma identidade configurada por usuário Nooo. O nome cadastrado não é inferido por nome, e-mail, telefone ou fornecedor.

Somente o gestor principal ativo configura, pelo novo painel `/admin/atendimento-jaaa`, acessível pelo menu **Atendimento Jaaa**. A aba **Representantes** apresenta nome, fornecedor, @usuário, ativação e preview do endereço final. A listagem considera somente usuários já vinculados a fornecedores e pagina 20 identidades no servidor. Busca por nome, contagem e fornecedores agregados são resolvidos no PostgreSQL; não retorna e-mails ou usuários comuns.

As escritas reutilizam `exigirGestorRepresentantes`, validam payload estrito com Zod, revalidam o administrador dentro da transação e registram auditoria administrativa na mesma transação. Ativar exige representante com acesso administrativo ativo, vínculo ativo e fornecedor ativo. Desativar preserva a configuração e permite desligar um vínculo que já esteja indisponível. Não há exclusão/recriação de usuário nem criação de permissão.

A formatação local não comprova existência ou titularidade no Jaaa. O gestor deve conferir o endereço público com o representante antes de ativá-lo. A Nooo não recebe senha, token pessoal ou segredo Jaaa.

## Atendimento por produto

A tabela `atendimentos_jaaa_produtos` possui uma escolha opcional e única por produto, referenciando a autorização existente daquele representante naquele produto. Limpar a escolha usa NULL e mantém o atendimento padrão Nooo.

A aba **Produtos** lista, com busca por nome/SKU e paginação server-side, produtos com autorização de representante ou configuração anterior de atendimento. A configuração é consultada somente quando o gestor abre o card de um produto; não há N+1 de chamadas para os demais cards. O campo **Representante para atendimento** mostra opções elegíveis ou informa que o destino anteriormente escolhido está indisponível, permitindo removê-lo explicitamente.

A consulta central `consultaElegiveisJaaa` é compartilhada pela configuração, apresentação pública e clique. Exige:

- Autorização ativa correspondente ao produto e vínculo correto.
- Representante com administrador ativo, vínculo ativo e fornecedor ativo.
- Identidade Jaaa configurada e ativa.
- Produto simples, uma única modalidade `dropshipping` ativa e vínculo comercial ativo com o fornecedor correspondente, sem associação comercial duplicada para o par.
- Para acesso público, produto também ativo e publicado, conforme a vitrine existente.

O gestor pode preparar atendimento de um rascunho/produto desativado; o público só recebe destino após publicação/ativação. A escolha não depende de comissão configurada, ativa ou visível. Não há fallback para o representante comissionado nem para o primeiro autorizado. Múltiplos representantes continuam possíveis, mas o destinatário público é sempre a escolha única explícita.

As abas aguardam a prontidão inicial da consulta antes de habilitar a navegação, evitando cliques anteriores à hidratação/carregamento. A transação serializa escolhas concorrentes pelo produto e bloqueia as referências comerciais e de acesso utilizadas na validação. O estado indisponível impede nova atribuição; uma revogação posterior desabilita a resolução de destino automaticamente. Trocas não reescrevem vendas antigas ou conversas existentes.

## Painel do representante

O representante vê o acesso **Abrir Jaaa** na listagem real de produtos e na página **Jaaa** do menu. A identificação nome/empresa e os menus já existentes foram preservados.

A query obtém o titular exclusivamente da sessão, exige administrador ativo, papel de representante e permissão existente de visualização da área restrita. A consulta SQL usa esse userId e confere identidade ativa e vínculo/fornecedor ativos. Não permite escolher usuário por payload, URL ou query string. A interface não apresenta campos administrativos; sem disponibilidade, informa que o acesso deve ser configurado pelo gestor.

## Contato público e pós-venda

A PDP real usa o card aprovado **Dúvidas sobre o produto?**, com botão **Falar pelo Jaaa** quando houver destino válido. Sem configuração, revogação, indisponibilidade ou falha de leitura, usa o contato padrão `/contato`. Produtos comuns continuam funcionando normalmente e não recebem atribuição automática.

A tela de pedido foi preservada, com seu atendimento padrão. Não há contrato externo seguro de contexto de pedido que justifique transmitir identificadores ou dados do pós-venda. Nenhum ID/número de pedido é enviado ao Jaaa.

## Clique, revogação, segurança e privacidade

O frontend recebe apenas a disponibilidade e uma rota interna de integração:

- Produto: `/api/jaaa/produto/[id]`.
- Representante: `/api/jaaa/representante`, sem ID de usuário.

O endpoint resolve novamente a disponibilidade atual antes de responder 303 para a origem controlada do Jaaa. Assim, um botão renderizado antes de uma revogação não conserva um destino desatualizado. As respostas são `Cache-Control: no-store` e `Referrer-Policy: no-referrer`. Os links também usam noopener/noreferrer e referrerPolicy=no-referrer.

Queries inesperadas no endpoint público levam ao contato padrão; no endpoint autenticado são recusadas. Um produto inválido/despublicado/não autorizado não revela dados de atendimento. Falhas de autenticação retornam resposta genérica. Fallbacks usam caminhos relativos da própria Nooo e não confiam em um domínio enviado pelo solicitante.

O helper puro aceita somente identidade canônica e monta o endereço a partir de `ORIGEM_PUBLICA_JAAA`. Recusa javascript:, URL livre, domínio falso, barras, fragmentos, query string e identidade fora do formato. Não há parâmetro de redirecionamento, token ou URL arbitrária do usuário.

A inativação bloqueia novos encaminhamentos pela Nooo; não apaga conversas nem revoga o uso direto de um endereço público já conhecido no Jaaa, que continua sob controle daquele sistema.

Não são enviados dados de cliente, endereço, contato pessoal, comissão, custo, margem ou pagamento. Não se consultam clientes/pedidos para resolver o atendimento. A edição administrativa de uma identidade não autoriza ler comissões ou produtos de terceiros.

## Banco e migration

Criada pelo Drizzle a migration **0064_vinculos_atendimento_jaaa.sql**, com snapshot e journal oficiais. Contém apenas:

- `identidades_jaaa_representantes`: FK de usuário/gestor, nome público com CHECK de formato, ativação e datas; índice único por usuário.
- `atendimentos_jaaa_produtos`: FKs de produto/autorização/gestor, datas; índice único por produto.

Os índices únicos são necessários para identidade única por representante, destinatário determinístico e resolução pontual. Não foram acrescentados índices especulativos ou campos nas estruturas de vendas/comissões.

Validados a sequência oficial de **65 migrations** e o delta 0063→0064: somente as duas tabelas novas. Cadeia ensaiada em Docker PostgreSQL descartável. Aplicação pelo comando oficial `npm run migrations:local`, somente no container persistente existente: **64/65 → 65/65**.

Contagens e hashes completos das **29 tabelas anteriores** foram comparados antes/depois: todos idênticos, incluindo os **149 produtos**, usuários, permissões, pedidos/itens, atribuições de comissão, snapshots, eventos e quitações. Nenhum representante real foi automaticamente configurado. Todas as configurações dos testes ficaram em bancos Docker descartáveis.

## Testes e resultados

Sem repetir as suítes das Etapas 2–7:

- Contrato puro: três testes direcionados já aprovados na revisão visual, cobrindo formato/normalização, entradas maliciosas, origem fixa e URL sem dados privados.
- Integração real: **seis cenários aprovados**, com PostgreSQL descartável e guards/actions/queries reais. Cobrem ausência de configuração, múltiplos representantes sem escolha implícita, gestor autorizado, representante/usuário comum/sem sessão impedidos de escrever, payload de outro titular recusado, identidade própria A/B, destinatário independente da comissão, preservação de snapshots e do comissionado, mudanças futuras de nome/destinatário, auditoria, unicidade, produto sem autorização, paginação e revogação de identidade/administrador/vínculo/fornecedor/grant/vínculo comercial/publicação/modalidade.
- Endpoints reais: redirecionamento 303, no-store/no-referrer, parâmetros inesperados bloqueados e fallback interno após revogação, inclusive usando o mesmo endereço que um botão anterior.
- Navegador real desktop e Android: **aprovado nos três perfis**; servidor Next, login de fixtures e PostgreSQL descartável. Links remotos interceptados e demais origens externas bloqueadas. Nenhum Jaaa remoto é acessado.
- Lint direcionado: sem erros; 22 avisos preexistentes de declarações não utilizadas no agregador `src/db/schema.ts`.
- Build local final: **aprovado**. Typecheck final: **aprovado** após restaurar a configuração temporária do Next. Build com identidade do banco local validada, variáveis fictícias de integrações e diretório `.next` isolado.

Comandos direcionados reproduzíveis:

```bash
NODE_OPTIONS=--conditions=react-server node --import tsx src/features/fornecedores/testes/jaaa/jaaa.integracao.testes.ts
node --import tsx src/features/fornecedores/testes/jaaa/jaaa.interface-real.testes.ts
npx tsc --noEmit
```

O laboratório aprovado `/test/representantes-jaaa` foi preservado com dados fictícios, guard de desenvolvimento local e noindex. Ele não substitui os testes das telas reais. Capturas dos fluxos reais em `docs/prototipos/representante-etapa-8-real/`.

## Limites e testes finais do projeto

A Nooo não autentica contas Jaaa, verifica titularidade remota ou garante que uma identidade digitada existe. Essas conferências ficam com o gestor usando o preview público e a conta correta do Jaaa. Para testar com representantes reais, cadastrar seus @usuários e escolher explicitamente o atendimento dos produtos; os novos vínculos iniciam vazios.

Não há contexto automático de produto/pedido, API de mensagens, cópia de conversas, aplicativo nativo, voz, vídeo, WhatsApp novo, IA nova, CRM, integração financeira, saque, Pix ou pagamento de comissão. Nada foi alterado no Jaaa. Possíveis evoluções exigem contrato explícito próprio, fora desta etapa.

A implementação está restrita ao ambiente local. Produção/Neon não foram acessados. Publicação e aplicação da cadeia remota permanecem dependentes de autorização específica. Não houve commit, push, deploy ou início de uma nova fase.

## Arquivos da Etapa 8

- `/home/junior/nuu/docs/prototipos/representante-etapa-8-real/cliente-android.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-8-real/cliente-desktop.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-8-real/gestor-android-produto.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-8-real/gestor-desktop-identidades.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-8-real/representante-android.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-8-real/representante-desktop.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-8/cliente-android.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-8/cliente-desktop.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-8/gestor-android.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-8/gestor-desktop.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-8/representante-android.png`
- `/home/junior/nuu/docs/prototipos/representante-etapa-8/representante-desktop.png`
- `/home/junior/nuu/docs/representantes-fornecedores-etapa-8.md`
- `/home/junior/nuu/drizzle/0064_vinculos_atendimento_jaaa.sql`
- `/home/junior/nuu/drizzle/meta/0064_snapshot.json`
- `/home/junior/nuu/drizzle/meta/_journal.json`
- `/home/junior/nuu/scripts/lib/validar-cadeia-migrations.ts`
- `/home/junior/nuu/scripts/validar-e-aplicar-migrations.ts`
- `/home/junior/nuu/src/app/admin/atendimento-jaaa/page.tsx`
- `/home/junior/nuu/src/app/api/jaaa/produto/[id]/route.ts`
- `/home/junior/nuu/src/app/api/jaaa/representante/route.ts`
- `/home/junior/nuu/src/app/test/representantes-jaaa/page.tsx`
- `/home/junior/nuu/src/components/admin/header.tsx`
- `/home/junior/nuu/src/db/schema.ts`
- `/home/junior/nuu/src/db/tables/representantes-fornecedores/jaaa.ts`
- `/home/junior/nuu/src/features/admin/layout/components/sidebar.tsx`
- `/home/junior/nuu/src/features/fornecedores/actions/jaaa/consultar-jaaa.ts`
- `/home/junior/nuu/src/features/fornecedores/actions/jaaa/salvar-atendimento-jaaa.ts`
- `/home/junior/nuu/src/features/fornecedores/actions/jaaa/salvar-identidade-jaaa.ts`
- `/home/junior/nuu/src/features/fornecedores/components/admin/jaaa/acesso-real-jaaa.tsx`
- `/home/junior/nuu/src/features/fornecedores/components/admin/jaaa/configuracao-produto-jaaa.tsx`
- `/home/junior/nuu/src/features/fornecedores/components/admin/jaaa/configurar-atendimento-produto.tsx`
- `/home/junior/nuu/src/features/fornecedores/components/admin/jaaa/configurar-identidade-jaaa.tsx`
- `/home/junior/nuu/src/features/fornecedores/components/admin/jaaa/pagina-atendimento-jaaa.tsx`
- `/home/junior/nuu/src/features/fornecedores/components/admin/jaaa/painel-gestao-jaaa.tsx`
- `/home/junior/nuu/src/features/fornecedores/components/admin/jaaa/previsualizacao-jaaa.tsx`
- `/home/junior/nuu/src/features/fornecedores/components/jaaa/cartao-acesso-jaaa.tsx`
- `/home/junior/nuu/src/features/fornecedores/components/store/jaaa/atendimento-publico-jaaa.tsx`
- `/home/junior/nuu/src/features/fornecedores/constants/jaaa/chaves.ts`
- `/home/junior/nuu/src/features/fornecedores/hooks/jaaa/use-jaaa.ts`
- `/home/junior/nuu/src/features/fornecedores/lib/jaaa/endereco-publico-jaaa.ts`
- `/home/junior/nuu/src/features/fornecedores/queries/jaaa/buscar-atendimento-produto-gestor.ts`
- `/home/junior/nuu/src/features/fornecedores/queries/jaaa/elegibilidade-atendimento.ts`
- `/home/junior/nuu/src/features/fornecedores/queries/jaaa/exigir-acesso-jaaa.ts`
- `/home/junior/nuu/src/features/fornecedores/queries/jaaa/listar-gestao-jaaa.ts`
- `/home/junior/nuu/src/features/fornecedores/queries/jaaa/redirecionar-atendimento-jaaa.ts`
- `/home/junior/nuu/src/features/fornecedores/queries/jaaa/resolver-destinos-jaaa.ts`
- `/home/junior/nuu/src/features/fornecedores/schemas/jaaa/gestao-jaaa.schema.ts`
- `/home/junior/nuu/src/features/fornecedores/schemas/jaaa/identidade-jaaa.schema.ts`
- `/home/junior/nuu/src/features/fornecedores/testes/jaaa/endereco-publico-jaaa.testes.ts`
- `/home/junior/nuu/src/features/fornecedores/testes/jaaa/fixture-jaaa.ts`
- `/home/junior/nuu/src/features/fornecedores/testes/jaaa/jaaa.integracao.testes.ts`
- `/home/junior/nuu/src/features/fornecedores/testes/jaaa/jaaa.interface-real.testes.ts`
- `/home/junior/nuu/src/features/fornecedores/testes/jaaa/revisao-visual.testes.ts`
- `/home/junior/nuu/src/features/fornecedores/testes/jaaa/validar-interface-real.ts`
- `/home/junior/nuu/src/features/products/components/admin/representantes/listagem-produtos-representante.tsx`
- `/home/junior/nuu/src/features/store/products/components/pagina-produto-aprovada.tsx`
