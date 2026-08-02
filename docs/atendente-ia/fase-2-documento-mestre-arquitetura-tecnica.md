# DOCUMENTO MESTRE DA FASE 2 — ARQUITETURA TÉCNICA DO ATENDENTE IA

**Projeto:** Atendente IA da loja virtual
**Fase:** Fase 2 — Arquitetura Técnica
**Status:** Em validação
**Finalidade:** Base oficial para a Fase 3 — Implementação
**Escopo:** Definições técnicas, sem implementação de código nesta fase

---

# 1. FINALIDADE DO DOCUMENTO

Este documento consolida as decisões aprovadas durante a **Fase 2 — Arquitetura Técnica do Atendente IA** da loja virtual.

A Fase 2 transforma as decisões funcionais da Fase 1 em uma arquitetura técnica segura, escalável, implementável, auditável e compatível com a estrutura atual da loja.

Este documento define:

* arquitetura geral do sistema;
* modelos de IA e integração com a OpenAI;
* orquestração das mensagens;
* contexto, memória e estado;
* ferramentas internas;
* fontes oficiais e base de conhecimento;
* persistência dos dados;
* RAG;
* canais e integrações;
* segurança e privacidade;
* resiliência;
* observabilidade e custos;
* estratégia de testes;
* infraestrutura;
* ordem recomendada para a implementação.

Este documento não:

* redefine os fundamentos comportamentais da Fase 0;
* modifica a arquitetura funcional aprovada na Fase 1;
* implementa código;
* executa migrações;
* cria integrações;
* inicia automaticamente a Fase 3.

As Fases 0 e 1 permanecem como fontes oficiais das definições comportamentais e funcionais. A Fase 2 define exclusivamente **como essas decisões serão construídas tecnicamente**.

---

# 2. CONTEXTO TÉCNICO DA LOJA

A arquitetura técnica do Atendente IA deverá respeitar a estrutura já existente na loja:

* Next.js App Router;
* React;
* TypeScript;
* Tailwind CSS;
* Server Components;
* TanStack Query;
* Drizzle ORM;
* PostgreSQL Neon;
* Better Auth;
* Zod;
* arquitetura organizada por domínio em `src/features/<dominio>`.

O Atendente IA será integrado inicialmente ao próprio site da loja e poderá futuramente ser expandido para outros canais, como o WhatsApp.

A loja possui produtos simples e com variantes, diferentes SKUs, promoções, estoque, modalidades comerciais, regras logísticas, entrega própria, frete externo, retirada, carrinho e checkout.

Essas estruturas continuarão sendo as fontes oficiais. A arquitetura da IA não deverá duplicar regras comerciais já existentes.

---

# 3. GRUPO 1 — ARQUITETURA GERAL E ESCOPO TÉCNICO

## 3.1 Decisão arquitetural central

O Atendente IA será construído como um **domínio modular dentro da aplicação Next.js existente**, seguindo a organização atual do projeto.

A estrutura principal ficará no domínio:

`src/features/atendimento-ia`

O MVP será implementado como um **monólito modular preparado para separação futura**, sem criação inicial de um microserviço independente.

Uma separação futura somente deverá ocorrer se volume, desempenho, segurança ou necessidades operacionais comprovarem essa necessidade.

## 3.2 Autoridade do servidor

O servidor será a única autoridade para:

* acessar os modelos;
* utilizar credenciais;
* montar o contexto;
* validar permissões;
* executar ferramentas;
* acessar fontes oficiais;
* realizar ações;
* registrar auditorias;
* controlar custos e limites.

A interface do cliente não poderá acessar diretamente:

* API da OpenAI;
* banco de dados;
* credenciais;
* ferramentas internas;
* serviços administrativos;
* integrações protegidas.

## 3.3 Entrada controlada

A API interna do Atendente IA será a única entrada autorizada para as mensagens.

Essa API deverá:

* validar a origem;
* identificar a conversa;
* verificar a sessão;
* aplicar limites;
* validar o formato;
* impedir requisições inválidas;
* encaminhar a execução ao orquestrador.

## 3.4 Fronteiras técnicas

O modelo de IA não terá acesso direto:

* ao PostgreSQL;
* ao Drizzle;
* a SQL;
* às credenciais;
* às integrações externas;
* ao painel administrativo;
* aos serviços internos da loja.

Todo acesso será realizado por ferramentas internas específicas e controladas.

## 3.5 Princípios arquiteturais

A arquitetura obedecerá aos seguintes princípios:

1. Servidor como única autoridade para modelos, ferramentas, segredos e ações.
2. Modelo sem acesso direto ao banco, SQL, credenciais ou administração.
3. Reutilização dos serviços oficiais da loja.
4. Nenhuma duplicação desnecessária de regras comerciais.
5. Ferramentas internas como fronteira obrigatória entre IA e domínios.
6. Preservação dos identificadores técnicos de produto, variante, SKU e modalidade.
7. Nova consulta dos dados comerciais quando houver possibilidade de mudança.
8. Contratos estruturados e validação antes da execução.
9. Privacidade por minimização, segregação e rastreabilidade.
10. Falha controlada em vez de informação incerta.
11. Liberação gradual e reversível.
12. Arquitetura preparada para evolução sem complexidade prematura.

## 3.6 Componentes principais

A arquitetura será dividida internamente em:

* interface de atendimento;
* API interna;
* orquestrador;
* adaptador da OpenAI;
* gerenciamento de contexto;
* estado da conversa;
* registro de ferramentas;
* camada de políticas;
* adaptadores dos domínios da loja;
* persistência;
* RAG e base de conhecimento;
* transferência humana;
* observabilidade;
* auditoria;
* avaliações e testes.

## 3.7 Recursos excluídos do MVP

Não serão adotados inicialmente:

* microserviços desnecessários;
* múltiplos agentes;
* modelo próprio;
* fine-tuning;
* execução livre de código pelo modelo;
* acesso direto do modelo à internet;
* troca automática de modelo sem regras;
* ferramentas genéricas com acesso irrestrito;
* recursos experimentais sem necessidade comprovada.

---

# 4. GRUPO 2 — MODELOS DE IA E API DA OPENAI

## 4.1 Interface oficial

A integração utilizará:

* **Responses API** como interface oficial;
* SDK oficial da OpenAI para TypeScript;
* execução exclusiva no servidor;
* adaptador interno entre o orquestrador e a OpenAI.

O adaptador permitirá alterar modelos, parâmetros e configurações sem espalhar dependências da OpenAI por todo o projeto.

## 4.2 Estratégia de modelos

A arquitetura utilizará:

* **`gpt-5.6-terra`** como modelo principal;
* **`gpt-5.6`**, utilizando o modelo `gpt-5.6-sol`, para escalonamento controlado.

O modelo principal será utilizado em:

* mensagens comuns;
* consultas;
* organização de respostas;
* atendimentos sem complexidade elevada.

O escalonamento poderá ocorrer em situações como:

* requisitos numerosos ou conflitantes;
* dificuldade de compreensão pelo modelo principal;
* recomendação de maior risco;
* falha na validação da resposta;
* necessidade de análise mais cuidadosa.

A seleção será realizada pelo servidor. O modelo não decidirá sozinho quando deve ser substituído.

## 4.3 Respostas e ferramentas

Serão utilizados:

* Function Calling para solicitação de ferramentas;
* respostas estruturadas quando o resultado técnico exigir formato controlado;
* streaming para o texto apresentado ao cliente;
* validação final antes da liberação de ações.

O streaming não autoriza uma ação antes da conclusão das validações necessárias.

## 4.4 Controle do histórico

Será utilizado inicialmente:

`store: false`

O histórico, o contexto e a memória permanecerão sob controle da própria loja e de seu PostgreSQL.

O ChatGPT Plus não substitui a contratação e cobrança separada da API da OpenAI.

## 4.5 Contratos estritos

As ferramentas internas utilizarão contratos estruturados com:

`strict: true`

Parâmetros inesperados ou incompatíveis deverão ser rejeitados.

## 4.6 Registro das execuções

Cada execução deverá registrar:

* modelo utilizado;
* nível de raciocínio;
* tokens consumidos;
* duração;
* ferramentas acionadas;
* ocorrência e motivo do escalonamento;
* sucesso ou falha;
* custo estimado.

---

# 5. GRUPO 3 — ORQUESTRAÇÃO DO ATENDIMENTO

## 5.1 Orquestrador central

O atendimento será coordenado por um **orquestrador central no servidor**.

O modelo poderá interpretar, raciocinar, solicitar ferramentas e redigir respostas, mas não executará livremente ações internas.

## 5.2 Ciclo técnico da mensagem

Cada mensagem seguirá o ciclo geral:

1. Receber a mensagem e identificar conversa, cliente e canal.
2. Validar formato, limites, segurança e permissões.
3. Recuperar o contexto necessário.
4. Consultar informações oficiais relevantes.
5. Enviar ao modelo somente o contexto necessário.
6. Receber uma resposta ou solicitação de ferramenta.
7. Validar a ferramenta e seus argumentos.
8. Executar somente ferramentas autorizadas.
9. Devolver o resultado ao modelo quando necessário.
10. Validar a resposta final.
11. Registrar a execução.
12. Entregar a resposta e atualizar o estado da conversa.

## 5.3 Estados técnicos

Cada mensagem poderá assumir estados como:

* `recebida`;
* `validando`;
* `processando`;
* `aguardando_ferramenta`;
* `executando_ferramenta`;
* `gerando_resposta`;
* `concluida`;
* `falhou`;
* `aguardando_atendimento_humano`.

## 5.4 Responsabilidades do orquestrador

O orquestrador deverá:

* selecionar o modelo;
* definir o nível de raciocínio;
* montar o contexto;
* controlar as ferramentas disponíveis;
* validar argumentos;
* impedir ações não autorizadas;
* controlar tempo, tentativas e repetições;
* registrar decisões e falhas;
* evitar processamento duplicado;
* acionar a transferência humana quando necessário.

## 5.5 Separação de responsabilidades

* **Modelo:** interpreta, raciocina, solicita ferramentas e redige.
* **Orquestrador:** controla o ciclo técnico.
* **Ferramentas:** executam funções específicas.
* **Políticas:** determinam permissões e limites.
* **Fontes oficiais:** fornecem os dados reais.

## 5.6 Proteção contra duplicidade

Mensagens e ações utilizarão identificadores únicos para impedir:

* respostas duplicadas;
* ações repetidas;
* solicitações duplicadas;
* repetição após falhas;
* execução simultânea incompatível.

Ações sensíveis não poderão ser repetidas automaticamente quando o resultado anterior for incerto.

## 5.7 Limites configuráveis

Serão estabelecidos limites para:

* duração total;
* chamadas de ferramentas;
* tentativas;
* tamanho do contexto;
* consumo de tokens;
* repetição do mesmo erro.

Ao atingir um limite, o sistema deverá encerrar com segurança, informar a limitação e encaminhar ao atendimento humano quando necessário.

---

# 6. GRUPO 4 — CONTEXTO, MEMÓRIA E ESTADO DA CONVERSA

## 6.1 Separação dos dados

O sistema separará:

* histórico completo;
* contexto operacional da mensagem;
* estado funcional;
* memória persistente;
* dados oficiais consultados.

O modelo receberá somente o necessário para a interação atual.

## 6.2 Histórico da conversa

Poderão ser armazenados:

* mensagens do cliente;
* respostas da IA;
* intervenções humanas;
* ferramentas utilizadas;
* ações realizadas;
* falhas;
* transferências.

Armazenar o histórico não significa enviá-lo integralmente ao modelo.

## 6.3 Contexto da mensagem

O contexto poderá conter:

* solicitação atual;
* mensagens recentes relevantes;
* resumo;
* produto ou pedido em discussão;
* informações confirmadas;
* pendências;
* resultados recentes;
* permissões e limitações.

## 6.4 Estado estruturado

O estado oficial da conversa poderá registrar:

* intenção atual;
* etapa;
* produtos mencionados;
* variante ou modalidade;
* necessidades;
* restrições;
* dados faltantes;
* recomendação apresentada;
* ação aguardando confirmação;
* transferência humana;
* encerramento.

O modelo poderá sugerir interpretações, mas o estado oficial será validado pelo sistema.

## 6.5 Memória de curto prazo

A memória de curto prazo poderá preservar:

* assunto atual;
* respostas fornecidas;
* comparações realizadas;
* dúvidas pendentes;
* decisões tomadas;
* informações necessárias para evitar repetição.

## 6.6 Memória persistente

A memória persistente será limitada a informações úteis, permitidas e justificáveis, como:

* preferências declaradas;
* escolhas anteriores;
* características relevantes;
* histórico resumido;
* consentimentos;
* restrições confirmadas.

Não serão transformados automaticamente em memória permanente:

* hipóteses da IA;
* conclusões não confirmadas;
* informações sensíveis desnecessárias;
* dados ocasionais;
* conteúdos de terceiros;
* informações sem finalidade futura.

## 6.7 Correção e exclusão

O cliente poderá:

* corrigir dados;
* atualizar preferências;
* solicitar que determinada memória não seja utilizada;
* solicitar exclusão quando aplicável.

Informações mais recentes e confirmadas prevalecerão sobre registros anteriores incompatíveis.

## 6.8 Resumo progressivo

Conversas extensas serão resumidas de forma estruturada, preservando:

* objetivo;
* fatos confirmados;
* decisões;
* pendências;
* ferramentas;
* ações executadas;
* informações necessárias para continuidade.

O resumo reduzirá o contexto enviado ao modelo, mas não substituirá automaticamente o histórico original armazenado.

## 6.9 Dados mutáveis

Preço, estoque, promoção, entrega, prazo e situação de pedido não permanecerão na memória como verdade permanente.

Esses dados deverão ser consultados novamente quando puderem ter mudado ou antes de ações importantes.

## 6.10 Isolamento

O sistema deverá impedir:

* mistura entre clientes;
* acesso não autorizado;
* associação incorreta de pedidos;
* reutilização indevida de dados;
* exposição de outra conversa.

---

# 7. GRUPO 5 — FERRAMENTAS INTERNAS E CONTRATOS DE EXECUÇÃO

## 7.1 Função das ferramentas

As ferramentas internas consultarão fontes oficiais e executarão ações autorizadas.

O modelo não terá acesso direto aos serviços internos.

## 7.2 Classificação

Cada ferramenta será classificada como:

* consulta pública;
* consulta protegida;
* ação reversível;
* ação sensível;
* encaminhamento humano.

A classificação determinará autenticação, confirmação, auditoria e permissões.

## 7.3 Ferramentas iniciais previstas

A arquitetura permitirá ferramentas para:

* buscar produtos;
* consultar detalhes;
* consultar variantes e modalidades;
* verificar preço e promoção;
* verificar estoque;
* consultar entrega;
* comparar produtos;
* consultar políticas;
* consultar pedido autorizado;
* registrar encaminhamento humano.

A lista definitiva dependerá das capacidades reais existentes durante a implementação.

## 7.4 Responsabilidade única

Cada ferramenta realizará uma função claramente definida.

Não será criada ferramenta genérica com liberdade para executar várias operações internas.

## 7.5 Contrato técnico

Cada ferramenta deverá possuir:

* nome estável;
* finalidade;
* parâmetros;
* tipos;
* validações;
* autenticação;
* permissões;
* classificação;
* resultado estruturado;
* erros possíveis;
* timeout;
* necessidade de confirmação;
* dados de auditoria;
* versão.

## 7.6 Resultado estruturado

O resultado deverá diferenciar:

* sucesso;
* ausência de resultado;
* informação incompleta;
* falta de autorização;
* dado inválido;
* indisponibilidade temporária;
* falha interna;
* necessidade de atendimento humano.

O modelo poderá transformar o resultado em linguagem natural, mas não alterar seu significado.

## 7.7 Validação

Antes da execução, o orquestrador verificará:

* existência e ativação;
* autorização de uso;
* validade dos parâmetros;
* identidade e permissão;
* confirmação necessária;
* limites;
* possível duplicidade.

## 7.8 Consultas e ações

Consultas sem alteração poderão ocorrer automaticamente quando necessárias.

Ações relevantes deverão obedecer ao nível de autonomia aprovado e exigir confirmação quando aplicável.

Uma intenção ambígua nunca será tratada como autorização.

## 7.9 Dados protegidos

A autenticação e a autorização serão determinadas pelo sistema, não pelo modelo.

O modelo não poderá decidir sozinho que uma pessoa é proprietária de determinado pedido ou cadastro.

## 7.10 Falhas

Quando uma ferramenta falhar, o sistema deverá:

1. identificar a falha;
2. repetir somente quando for seguro;
3. impedir duplicidade;
4. usar alternativa oficial quando existir;
5. explicar a limitação;
6. encaminhar ao humano quando necessário.

## 7.11 Versionamento

Mudanças incompatíveis nos contratos não poderão ocorrer silenciosamente.

Ferramentas poderão ser substituídas ou desativadas sem modificar os fundamentos do Atendente IA.

---

# 8. GRUPO 6 — FONTES OFICIAIS E BASE DE CONHECIMENTO

## 8.1 Separação das fontes

O Atendente IA utilizará:

* dados operacionais atuais;
* conhecimento institucional oficial.

O conhecimento geral do modelo não será considerado fonte oficial da loja.

## 8.2 Dados operacionais

Serão consultados por ferramentas:

* preço;
* promoção;
* estoque;
* disponibilidade;
* variantes;
* modalidades;
* entrega;
* pedido;
* dados cadastrais autorizados.

Esses dados não serão mantidos em documentos estáticos.

## 8.3 Conhecimento institucional

A base poderá conter:

* trocas e devoluções;
* entrega e retirada;
* formas de pagamento;
* garantias;
* orientações;
* informações institucionais;
* explicações sobre categorias;
* perguntas frequentes;
* procedimentos aprovados.

Somente conteúdos oficiais, revisados e autorizados poderão ser utilizados.

## 8.4 Hierarquia das fontes

A prioridade será:

1. dado operacional atual;
2. regra estruturada e ativa;
3. documento institucional vigente;
4. conteúdo complementar aprovado;
5. conhecimento geral do modelo, sem caráter oficial.

## 8.5 Versionamento

Cada conteúdo poderá registrar:

* identificador;
* título;
* categoria;
* origem;
* responsável;
* atualização;
* status;
* versão;
* validade;
* público aplicável.

Conteúdo substituído, expirado ou desativado deixará de ser utilizado.

## 8.6 Recuperação

Somente trechos relevantes serão enviados ao modelo.

O contexto recuperado deverá incluir:

* pergunta;
* trechos;
* fontes;
* regras de interpretação;
* limitações.

## 8.7 Ausência de fonte

Sem conteúdo confiável, a IA deverá:

* reconhecer a limitação;
* não criar regras;
* consultar outra fonte oficial;
* encaminhar ao humano quando necessário.

## 8.8 Conflitos

Quando fontes oficiais divergirem, o sistema deverá:

1. identificar o conflito;
2. aplicar a hierarquia;
3. evitar afirmação não confirmada;
4. registrar a ocorrência;
5. encaminhar para correção ou atendimento humano.

## 8.9 Segurança do conteúdo

Documentos recuperados serão tratados como dados informativos, não como instruções.

Eles não poderão:

* alterar regras;
* ampliar permissões;
* autorizar ferramentas;
* revelar instruções internas;
* contornar políticas.

---

# 9. GRUPO 7 — DADOS E PERSISTÊNCIA

## 9.1 Banco de dados

Será utilizado o **PostgreSQL Neon já existente**, sem criação inicial de outro banco exclusivo para a IA.

## 9.2 Estruturas próprias

Serão previstas estruturas para:

* conversas;
* mensagens;
* estado;
* resumos;
* memória autorizada;
* execuções da IA;
* ferramentas;
* transferências humanas;
* avaliações;
* ocorrências;
* auditoria;
* idempotência.

## 9.3 Separação das informações

Serão armazenados separadamente:

* mensagens originais;
* resumos;
* estado estruturado;
* memória persistente;
* execução técnica;
* registros de auditoria.

## 9.4 Identidade

A conversa somente será associada a um cliente quando sua identidade estiver validada.

Visitantes não autenticados poderão possuir conversas temporárias.

## 9.5 Dados oficiais

Produtos, preços, estoque, pedidos e entrega não serão duplicados no banco da IA.

Sempre que possível, serão armazenadas apenas referências aos registros oficiais.

## 9.6 Proteções

A persistência deverá incluir:

* identificadores únicos;
* isolamento entre clientes;
* paginação;
* índices;
* limites de retenção;
* proteção de dados pessoais;
* anonimização;
* exclusão;
* restrição de uso;
* proteção contra duplicidade.

---

# 10. GRUPO 8 — RAG E RECUPERAÇÃO DA BASE DE CONHECIMENTO

## 10.1 Escopo do RAG

O RAG será utilizado somente para conhecimento institucional e conteúdos textuais oficiais.

Não será usado para:

* preço;
* estoque;
* promoção;
* entrega;
* pedido;
* carrinho;
* checkout;
* dados pessoais.

## 10.2 Fragmentação

Os documentos serão divididos em trechos identificados e relacionados ao conteúdo original.

Cada trecho poderá possuir:

* categoria;
* versão;
* status;
* vigência;
* produto relacionado;
* público;
* atualização;
* origem.

## 10.3 Recuperação híbrida

A recuperação combinará:

* busca semântica;
* filtros estruturados;
* critérios de relevância.

Somente documentos publicados, ativos e vigentes poderão ser utilizados.

## 10.4 Relevância mínima

Poucos trechos com maior relevância serão recuperados inicialmente.

Sem relevância suficiente, o sistema retornará ausência de informação confiável.

## 10.5 Armazenamento vetorial

Será avaliado inicialmente o uso do **pgvector no PostgreSQL Neon**, antes da introdução de um serviço vetorial separado.

O documento original continuará sendo a fonte oficial. A representação vetorial servirá apenas para localização.

## 10.6 Atualização

A indexação será atualizada quando um documento for:

* publicado;
* alterado;
* substituído;
* expirado;
* desativado.

As fontes utilizadas em respostas relevantes deverão ser registradas.

---

# 11. GRUPO 9 — INTEGRAÇÕES E CANAIS DE ATENDIMENTO

## 11.1 Canal inicial

O primeiro canal será o **chat do próprio site**.

O núcleo do Atendente IA não ficará dependente exclusivamente desse canal.

## 11.2 Formato interno comum

Cada canal utilizará um adaptador para converter mensagens em um formato interno padronizado.

Serão preservados:

* canal;
* horário;
* identificador da mensagem;
* sessão;
* status de entrega;
* origem.

## 11.3 Continuidade

A conversa poderá continuar entre páginas do site quando a associação for válida.

Conversas de canais diferentes não serão misturadas automaticamente sem associação segura do cliente.

## 11.4 WhatsApp

A arquitetura será preparada para futura integração com WhatsApp, mas sua integração completa não será obrigatória no primeiro MVP.

Caso o encaminhamento inicial utilize WhatsApp, deverá levar:

* resumo;
* referência da conversa;
* necessidade;
* informações confirmadas;
* pendências;
* motivo da transferência.

## 11.5 Falhas externas

Falhas de uma integração específica não deverão indisponibilizar todo o Atendente IA.

Integrações externas deverão validar origem, assinatura e autenticidade quando aplicável.

---

# 12. GRUPO 10 — SEGURANÇA, PRIVACIDADE E CONTROLE DE ACESSO

## 12.1 Execução protegida

Toda comunicação com a OpenAI e ferramentas ocorrerá no servidor.

Credenciais serão mantidas em variáveis de ambiente seguras.

## 12.2 Menor privilégio

Cada ferramenta receberá somente o acesso necessário à sua função.

Serão separadas permissões para:

* consultas públicas;
* consultas protegidas;
* alterações;
* ações sensíveis;
* operações administrativas.

## 12.3 Identidade

Pedidos e dados pessoais somente serão consultados após autenticação e autorização adequadas.

Informações fornecidas na conversa não serão usadas isoladamente como prova de identidade.

## 12.4 Confirmação

Ações com consequências relevantes exigirão confirmação explícita quando determinada pelas regras de autonomia.

## 12.5 Proteções obrigatórias

A arquitetura deverá proteger contra:

* prompt injection;
* instruções maliciosas em documentos;
* revelação de instruções internas;
* abuso de ferramentas;
* acesso cruzado;
* repetição de ações;
* excesso de requisições;
* uso indevido de credenciais.

## 12.6 Limitação de uso

Poderão ser aplicados limites por:

* cliente;
* sessão;
* IP;
* canal;
* ferramenta;
* risco da operação.

## 12.7 Minimização

Somente os dados pessoais necessários serão enviados à OpenAI.

Logs deverão remover ou mascarar informações sensíveis.

## 12.8 LGPD

Retenção, anonimização, exclusão e uso dos dados deverão respeitar:

* finalidade;
* necessidade operacional;
* política da empresa;
* obrigações legais;
* direitos do titular;
* LGPD.

---

# 13. GRUPO 11 — FALHAS, RESILIÊNCIA E CONTINUIDADE

## 13.1 Classificação das falhas

As falhas serão classificadas como:

* entrada inválida;
* modelo indisponível;
* ferramenta indisponível;
* integração indisponível;
* falta de autorização;
* limite excedido;
* ausência de dado oficial;
* conflito entre fontes;
* erro interno.

## 13.2 Retentativas

Novas tentativas automáticas ocorrerão somente quando:

* a falha for temporária;
* a operação for segura;
* não houver risco de duplicidade.

Poderão ser usados intervalos progressivos entre tentativas.

## 13.3 Ações sensíveis

Ações sensíveis não serão repetidas automaticamente quando o resultado anterior for incerto.

Antes de tentar novamente, o sistema deverá consultar o estado e a idempotência da operação.

## 13.4 Timeouts

Serão definidos limites de tempo para:

* modelo;
* ferramenta;
* integração;
* ciclo completo.

## 13.5 Recuperação

O estado persistido permitirá recuperação após interrupções.

Identificadores de idempotência impedirão duplicidade.

## 13.6 Saída segura

Quando não for possível continuar:

* a limitação será explicada;
* o contexto será preservado;
* o atendimento será encaminhado;
* a ocorrência será registrada.

Nenhuma falha será preenchida com uma informação inventada.

---

# 14. GRUPO 12 — OBSERVABILIDADE, AUDITORIA, CUSTOS E QUALIDADE

## 14.1 Registro das execuções

Cada execução registrará:

* conversa;
* mensagem;
* modelo;
* nível de raciocínio;
* tokens;
* duração;
* ferramentas;
* fontes;
* erros;
* escalonamentos;
* resultado;
* custo estimado.

## 14.2 Separação dos registros

Logs técnicos serão separados:

* do conteúdo integral das conversas;
* dos dados pessoais;
* da auditoria;
* das métricas agregadas.

## 14.3 Métricas

Serão acompanhados:

* tempo de resposta;
* taxa de sucesso;
* falhas por ferramenta;
* transferências;
* respostas sem fonte;
* consumo;
* custo;
* satisfação;
* perguntas repetidas;
* bloqueios de segurança.

## 14.4 Rastreabilidade

Será possível acompanhar uma resposta desde:

1. mensagem recebida;
2. contexto utilizado;
3. modelo selecionado;
4. ferramentas chamadas;
5. fontes consultadas;
6. validações;
7. resposta final.

## 14.5 Alertas

Serão criados alertas para:

* aumento de erros;
* custo elevado;
* lentidão;
* falhas contínuas;
* uso indevido;
* indisponibilidade de ferramentas importantes.

## 14.6 Controle de custos

Serão configurados limites de:

* tokens;
* ferramentas;
* custo por mensagem;
* custo por atendimento;
* custo por período.

## 14.7 Avaliação

Será realizada avaliação humana por amostragem.

Falhas reais analisadas poderão se tornar casos permanentes de teste.

Conversas não serão utilizadas automaticamente para treinamento sem política e autorização adequadas.

---

# 15. GRUPO 13 — ESTRATÉGIA DE TESTES E VALIDAÇÃO

## 15.1 Testes unitários

Deverão validar:

* contratos;
* schemas;
* permissões;
* autonomia;
* estados;
* validações;
* idempotência;
* prevenção de duplicidade.

## 15.2 Testes de integração

Deverão abranger:

* OpenAI;
* PostgreSQL;
* ferramentas;
* RAG;
* catálogo;
* preços;
* estoque;
* promoções;
* entrega;
* pedidos;
* transferência humana.

## 15.3 Testes conversacionais

Deverão incluir:

* perguntas simples;
* dúvidas ambíguas;
* recomendações;
* comparações;
* objeções;
* ausência de informação;
* mudança de assunto;
* retomada;
* transferência humana.

## 15.4 Testes de segurança

Deverão incluir:

* prompt injection;
* tentativa de revelar instruções;
* acesso a pedido de terceiro;
* parâmetros maliciosos;
* repetição;
* abuso de requisições;
* conteúdo malicioso na base.

## 15.5 Testes de falha

Deverão simular:

* indisponibilidade da OpenAI;
* ferramenta fora do ar;
* timeout;
* resultado incompleto;
* conflito entre fontes;
* interrupção durante o processamento.

## 15.6 Avaliações de qualidade

Serão avaliados:

* correção;
* fidelidade às fontes;
* utilidade;
* segurança;
* clareza;
* comportamento aprovado na Fase 0;
* cumprimento da Fase 1.

## 15.7 Conjunto fixo

Um conjunto fixo e versionado de cenários será utilizado para comparar mudanças em:

* modelo;
* instruções;
* RAG;
* ferramentas;
* parâmetros.

## 15.8 Bloqueio de publicação

Falhas críticas impedirão a liberação.

Testes iniciais utilizarão contas, produtos, pedidos e dados descartáveis.

Testes destrutivos não serão executados sobre dados reais.

---

# 16. GRUPO 14 — INFRAESTRUTURA, IMPLANTAÇÃO E ORDEM DE CONSTRUÇÃO

## 16.1 Estrutura inicial

O Atendente IA será integrado à aplicação atual como domínio modular.

Serão separados internamente:

* chat;
* entrada de mensagens;
* orquestrador;
* políticas;
* ferramentas;
* contexto;
* memória;
* RAG;
* auditoria;
* métricas.

## 16.2 Monólito modular

O projeto começará sem microserviços desnecessários.

A separação futura poderá ocorrer se houver necessidade comprovada.

## 16.3 Ambientes

Serão mantidos ambientes separados para:

* desenvolvimento;
* testes ou homologação;
* produção.

Cada ambiente terá suas próprias configurações e credenciais.

## 16.4 Controles de ativação

Recursos poderão ser ativados ou desativados individualmente:

* Atendente IA;
* modelos;
* ferramentas;
* memória;
* escalonamento;
* RAG;
* canais;
* ações;
* recursos experimentais.

## 16.5 Processamento assíncrono

Filas e processamento assíncrono serão introduzidos somente quando a tarefa não precisar ser concluída imediatamente ou quando houver necessidade técnica real.

## 16.6 Continuidade e rollback

A arquitetura deverá permitir:

* desativação rápida;
* retorno ao atendimento humano;
* cópias de segurança;
* recuperação dos dados;
* rollback;
* implantação gradual;
* monitoramento durante a liberação.

## 16.7 Ordem recomendada da Fase 3

A implementação seguirá esta ordem:

1. Auditar a estrutura atual do projeto.
2. Criar estruturas de dados e configurações.
3. Implementar entrada de mensagens e estados.
4. Implementar o orquestrador.
5. Integrar a Responses API.
6. Criar ferramentas públicas de consulta.
7. Implementar contexto, resumo e memória de curto prazo.
8. Criar base institucional e RAG.
9. Implementar ferramentas protegidas e autenticação.
10. Implementar transferência humana.
11. Implementar segurança, auditoria e métricas.
12. Executar testes completos.
13. Realizar liberação interna.
14. Realizar liberação gradual para clientes.
15. Expandir futuramente para novos canais e ações.

---

# 17. ESCOPO CONSOLIDADO DO MVP

O MVP deverá incluir:

* chat no site;
* API interna protegida;
* orquestrador central;
* Responses API;
* modelo principal e escalonamento controlado;
* persistência própria;
* contexto e memória temporária;
* ferramentas essenciais de consulta;
* integração com fontes oficiais;
* base institucional e RAG quando houver conteúdo revisado;
* transferência humana;
* segurança;
* auditoria;
* métricas;
* avaliações;
* testes;
* controles de ativação;
* liberação gradual.

Permanecem fora do MVP:

* múltiplos agentes;
* voz;
* modelo próprio;
* fine-tuning;
* segundo fornecedor de IA;
* internet aberta;
* execução de código pelo modelo;
* microserviços sem necessidade;
* pagamento realizado pela IA;
* pedido autônomo;
* aprendizagem automática de regras;
* integração completa com a API do WhatsApp Business.

---

# 18. DECISÕES TÉCNICAS CONSOLIDADAS

| Área                 | Decisão                                                        |
| -------------------- | -------------------------------------------------------------- |
| Arquitetura          | Domínio modular em `src/features/atendimento-ia`               |
| Estrutura inicial    | Monólito modular preparado para evolução                       |
| Autoridade           | Servidor como única autoridade                                 |
| OpenAI               | Responses API e SDK oficial para TypeScript                    |
| Modelo principal     | `gpt-5.6-terra`                                                |
| Escalonamento        | `gpt-5.6` com `gpt-5.6-sol`, de forma controlada               |
| Armazenamento OpenAI | `store: false`                                                 |
| Estado oficial       | PostgreSQL Neon da própria loja                                |
| Orquestração         | Orquestrador central no servidor                               |
| Ferramentas          | Específicas, estritas, versionadas e controladas               |
| Validação            | Contratos estritos e validação com Zod                         |
| Dados comerciais     | Sempre consultados nas fontes oficiais                         |
| Memória              | Separada entre conversa, contexto, estado e memória autorizada |
| RAG                  | Somente conteúdo institucional revisado                        |
| Dados vetoriais      | Avaliar inicialmente pgvector no PostgreSQL Neon               |
| Canal inicial        | Chat do site                                                   |
| WhatsApp             | Preparação para evolução e transferência humana                |
| Segurança            | Menor privilégio, autenticação externa ao modelo e minimização |
| Resiliência          | Timeouts, retentativas seguras e idempotência                  |
| Observabilidade      | Logs, métricas, rastreamento, custos e auditoria               |
| Testes               | Unitários, integração, conversacionais, segurança e falhas     |
| Implantação          | Feature flags, liberação gradual e rollback                    |
| Evolução             | Sem complexidade prematura                                     |

---

# 19. CRITÉRIOS PARA INICIAR A FASE 3

A Fase 3 poderá começar após:

1. revisão completa deste Documento Mestre;
2. alteração do status para “Aprovado” exclusivamente pelo responsável pelo projeto;
3. confirmação do escopo do MVP;
4. disponibilização do projeto e da branch correta;
5. definição dos ambientes;
6. definição dos dados descartáveis para testes;
7. identificação das dependências externas;
8. realização da auditoria inicial da estrutura existente;
9. confirmação de que a implementação respeitará as Fases 0, 1 e 2.

---

# 20. DISPOSIÇÕES FINAIS

A Fase 2 define a arquitetura técnica oficial do Atendente IA.

Nenhuma implementação foi realizada durante esta fase.

As decisões deste documento não substituem:

* os fundamentos da Fase 0;
* a arquitetura funcional da Fase 1;
* as regras comerciais oficiais da loja;
* os mecanismos atuais de catálogo, promoção, estoque, logística, carrinho e checkout.

A Fase 3 deverá transformar esta arquitetura em implementação real, seguindo:

* a ordem de construção definida;
* os limites de segurança;
* a reutilização dos serviços oficiais;
* os contratos técnicos;
* os testes obrigatórios;
* a liberação gradual;
* a possibilidade de rollback.

# ADENDO OFICIAL AO DOCUMENTO MESTRE DA FASE 2

## Contexto, resumo e memória de curto prazo

**Projeto:** Atendente IA da Loja Virtual
**Documento vinculado:** Documento Mestre da Fase 2 — Arquitetura Técnica
**Status do adendo:** Aprovado
**Data de aprovação:** 1º de agosto de 2026

## 1. Finalidade

Este adendo complementa a Fase 2 exclusivamente com os parâmetros técnicos necessários para implementar contexto, resumo e memória de curto prazo na Fase 3.

As demais decisões do Documento Mestre da Fase 2 permanecem inalteradas.

## 2. Limite do contexto

2.1. O limite máximo inicial será de **8.000 tokens de entrada por processamento**.

2.2. O limite será configurável, permitindo ajustes futuros sem alteração de código.

2.3. O sistema enviará somente o conteúdo necessário para cada processamento, sem preencher obrigatoriamente os 8.000 tokens.

2.4. A mensagem atual terá prioridade e não poderá ser descartada para acomodar histórico, resumo ou memória.

2.5. Instruções oficiais, contexto relevante e resultados necessários de ferramentas deverão ser considerados dentro do mesmo orçamento.

## 3. Geração e atualização do resumo

3.1. Conversas curtas não deverão gerar resumo.

3.2. O primeiro resumo será gerado quando o contexto selecionado atingir **6.000 tokens**.

3.3. Depois do primeiro resumo, ele será atualizado quando forem acumulados mais **4.000 tokens relevantes** ainda não abrangidos pela última versão válida.

3.4. O resumo também deverá ser atualizado antes que o contexto necessário ultrapasse o limite máximo de 8.000 tokens.

3.5. Não haverá geração ou atualização quando não existir conteúdo novo relevante.

3.6. O resumo deverá:

* representar somente informações efetivamente presentes na conversa;
* diferenciar fatos, hipóteses, dúvidas e decisões;
* preservar informações ainda relevantes;
* não transformar suposições em fatos;
* não conter raciocínio interno, credenciais ou informações técnicas desnecessárias;
* permanecer vinculado exclusivamente à conversa de origem.

## 4. Expiração

4.1. O contexto temporário de visitante expirará após **7 dias sem interação**.

4.2. O contexto temporário de cliente autenticado expirará após **30 dias sem interação**.

4.3. A memória de curto prazo expirará após **30 dias da última utilização válida**.

4.4. Uma utilização válida poderá renovar sua expiração por mais 30 dias.

4.5. Informações ligadas somente a uma compra ou necessidade momentânea não terão renovação automática depois que o assunto for encerrado.

4.6. O cliente poderá solicitar a remoção antes da expiração.

4.7. Todos os prazos serão configuráveis sem alteração de código.

## 5. Categorias autorizadas para memória

5.1. Somente poderão ser persistidas informações confirmadas e úteis para a continuidade do atendimento comercial:

* tipo de produto procurado;
* medidas, tamanho ou características desejadas;
* faixa de preço informada pelo cliente;
* preferências de compra;
* restrições de entrega relevantes;
* produtos comparados ou considerados;
* decisão de compra ainda pendente;
* objeções comerciais declaradas;
* preferência de atendimento expressamente informada;
* etapa atual da intenção de compra.

5.2. Não poderão ser armazenados como memória:

* senhas, tokens, chaves ou códigos de autenticação;
* dados completos de cartão ou pagamento;
* dados bancários;
* documentos pessoais desnecessários;
* informações sensíveis sem necessidade comercial autorizada;
* conteúdo administrativo da loja;
* custos, margens ou fornecedores;
* suposições ou interpretações produzidas pela IA;
* raciocínio interno do modelo;
* informações pertencentes a outro usuário ou conversa;
* mensagens sem utilidade futura para o atendimento.

5.3. Nenhuma mensagem será transformada automaticamente em memória apenas por ter sido enviada pelo cliente.

## 6. Autorização e consentimento

### 6.1. Contexto da conversa atual

O uso das mensagens dentro da própria conversa será permitido quando:

* o cliente tiver recebido o aviso de privacidade do chat; e
* iniciar voluntariamente a conversa.

O registro técnico deverá conter:

* versão do aviso apresentado;
* data e hora;
* sessão ou usuário correspondente;
* evento de início da conversa.

### 6.2. Memória reutilizável

A reutilização de memória em conversas futuras exigirá autorização explícita do cliente por opção clara e separada, equivalente a:

> Permitir que o assistente lembre minhas preferências por 30 dias para continuar meu atendimento.

O registro deverá conter:

* evento de autorização;
* versão do texto apresentado;
* data e hora;
* usuário autenticado;
* origem da autorização;
* situação ativa ou revogada.

6.3. Visitantes anônimos não poderão ter suas memórias associadas automaticamente a uma conta após autenticação ou cadastro.

6.4. Memória reutilizável ficará restrita a usuários autenticados com autorização válida.

## 7. Duplicidade e contradição

7.1. Cada memória terá uma chave lógica composta por **categoria e assunto normalizado**.

7.2. Uma informação igual não criará nova memória. Será atualizada somente a data da utilização válida.

7.3. Informações complementares poderão ser reunidas quando não houver conflito.

7.4. Quando o cliente corrigir explicitamente uma informação, a declaração mais recente substituirá a anterior.

7.5. A memória anterior será marcada como substituída, preservando a rastreabilidade permitida.

7.6. Se não for possível determinar qual informação é correta:

* nenhuma será assumida como verdadeira;
* a contradição será registrada de forma controlada;
* o atendente deverá solicitar confirmação direta ao cliente quando a informação for necessária.

7.7. Informações de conversas diferentes somente poderão ser combinadas quando pertencerem comprovadamente ao mesmo usuário autenticado e houver autorização válida.

## 8. Versionamento e validade dos resumos

8.1. Cada resumo deverá registrar:

* número sequencial da versão;
* conversa de origem;
* última mensagem incluída;
* quantidade de mensagens consideradas;
* hash técnico do conteúdo considerado;
* data e hora da criação;
* execução responsável;
* situação: válido, substituído ou inválido;
* referência à versão anterior, quando existente.

8.2. Antes de utilizar um resumo, o sistema deverá validar:

* pertencimento à conversa atual;
* situação válida;
* última mensagem abrangida;
* compatibilidade dos vínculos e do hash;
* mensagens posteriores que ainda precisam ser incluídas diretamente.

8.3. O resumo mais recente somente substituirá o anterior depois de ser validado e persistido com sucesso.

8.4. Se a atualização falhar, o último resumo válido será preservado.

8.5. Resumos de conversas diferentes não poderão ser misturados, reaproveitados ou vinculados entre si.

## 9. Segurança e isolamento

9.1. Todo contexto, resumo e memória deverá permanecer isolado por usuário, sessão e conversa, conforme o tipo de informação.

9.2. O sistema não deverá persistir:

* chain of thought;
* raciocínio interno;
* credenciais;
* conteúdo administrativo desnecessário;
* informações proibidas ou restritas;
* cópias integrais redundantes do contexto sem necessidade aprovada.

9.3. Falhas de geração, validação ou persistência não poderão:

* corromper o contexto;
* apagar o último resumo válido;
* misturar usuários ou conversas;
* transformar informações incertas em fatos;
* produzir respostas inventadas ao cliente.

## 10. Diretriz econômica

10.1. A implementação deverá reduzir consumo desnecessário da API:

* sem resumo em conversas curtas;
* sem atualização quando não houver conteúdo relevante;
* utilizando somente o contexto necessário;
* evitando memórias duplicadas;
* sem chamada adicional ao modelo em todas as mensagens;
* mantendo limites e prazos configuráveis.

## 11. Encerramento

Este adendo integra oficialmente a Fase 2 e fornece as decisões necessárias para a implementação do bloco de contexto, resumo e memória de curto prazo na Fase 3.

Nenhum fundamento das Fases 0 e 1 ou das demais partes da Fase 2 é substituído por este adendo.

# SEGUNDO ADENDO OFICIAL AO DOCUMENTO MESTRE DA FASE 2

## Base institucional e RAG

**Projeto:** Atendente IA da Loja Virtual
**Documento vinculado:** Documento Mestre da Fase 2 — Arquitetura Técnica
**Status do adendo:** Aprovado
**Data de aprovação:** 1º de agosto de 2026

## 1. Finalidade

Este adendo complementa a Fase 2 com as decisões técnicas necessárias para implementar a base institucional e o mecanismo de RAG na Fase 3.

As demais decisões aprovadas nas Fases 0, 1 e 2 permanecem inalteradas.

## 2. Função do RAG

2.1. O RAG será responsável por localizar conteúdo institucional revisado e fornecer ao Atendente IA fontes confiáveis para responder às dúvidas dos clientes.

2.2. O RAG não substituirá as ferramentas responsáveis pela consulta de informações comerciais variáveis da loja.

2.3. O Atendente IA não poderá tratar conhecimento geral do modelo como informação oficial da empresa.

2.4. Quando não existir fonte institucional suficientemente relevante, o sistema deverá registrar ausência de informação confiável e impedir respostas inventadas ou apresentadas como regra oficial da loja.

## 3. Armazenamento vetorial

3.1. Os vetores serão armazenados no PostgreSQL utilizado pelo projeto, por meio da extensão `pgvector`.

3.2. Não será contratado inicialmente um banco vetorial separado.

3.3. A implementação deverá preservar isolamento, rastreabilidade, versionamento e possibilidade de substituição futura do mecanismo de armazenamento.

## 4. Modelo de embeddings

4.1. O modelo inicial será `text-embedding-3-small`.

4.2. A dimensão inicial será de 1.536 dimensões.

4.3. Modelo e dimensão deverão ser configuráveis.

4.4. A implementação não poderá misturar vetores produzidos por modelos ou dimensões incompatíveis.

4.5. Mudança de modelo ou dimensão exigirá nova indexação controlada do conteúdo correspondente.

## 5. Fragmentação do conteúdo

5.1. O tamanho inicial máximo de cada fragmento será de 600 tokens.

5.2. A sobreposição inicial será de 100 tokens entre fragmentos consecutivos.

5.3. Os valores deverão ser configuráveis.

5.4. A fragmentação deverá respeitar, sempre que possível:

* títulos;
* subtítulos;
* parágrafos;
* listas;
* perguntas e respostas;
* divisões lógicas do documento.

5.5. A fragmentação não deverá cortar uma regra de forma que altere ou prejudique seu significado.

5.6. Cada fragmento deverá preservar vínculo rastreável com:

* documento original;
* versão do documento;
* seção de origem;
* posição no documento;
* hash do conteúdo;
* situação de publicação;
* data da indexação;
* modelo e dimensão do embedding utilizado.

## 6. Busca híbrida

6.1. A recuperação combinará:

* busca semântica por vetores, com peso inicial de 70%;
* busca textual do PostgreSQL, com peso inicial de 30%.

6.2. Os pesos deverão ser configuráveis.

6.3. A pontuação resultante será uma medida de relevância e não representa preço ou custo financeiro.

6.4. A implementação deverá normalizar adequadamente as pontuações antes da combinação, evitando comparar escalas incompatíveis.

6.5. A busca textual deverá favorecer termos exatos relevantes, como nomes oficiais de políticas, modalidades e serviços.

6.6. A busca semântica deverá reconhecer perguntas equivalentes formuladas com palavras diferentes das utilizadas nos documentos.

## 7. Quantidade de resultados e relevância

7.1. A busca poderá recuperar inicialmente até cinco fragmentos candidatos.

7.2. Somente os três melhores fragmentos suficientemente relevantes poderão ser enviados ao modelo em cada resposta.

7.3. A relevância mínima inicial será de 0,70.

7.4. O limite deverá ser configurável e validado posteriormente com perguntas reais.

7.5. Fragmentos abaixo da relevância mínima não poderão fundamentar uma resposta institucional.

7.6. O sistema deverá evitar fragmentos duplicados ou excessivamente semelhantes no mesmo contexto.

7.7. A recuperação deverá respeitar o orçamento de contexto aprovado no primeiro adendo da Fase 2.

## 8. Conteúdo permitido

A base institucional poderá conter exclusivamente conteúdo real, revisado e aprovado da loja, incluindo:

* informações institucionais da empresa;
* canais e horários de atendimento;
* políticas de troca e devolução;
* políticas de garantia;
* formas de pagamento;
* regras institucionais de entrega e retirada;
* orientações gerais de atendimento;
* privacidade e segurança;
* perguntas frequentes oficialmente revisadas;
* outras informações institucionais estáveis formalmente aprovadas.

## 9. Conteúdo excluído do RAG

Não deverão ser utilizados como conhecimento institucional estático:

* preços atuais;
* estoque;
* disponibilidade atual de produtos ou variantes;
* prazo e valor calculado de frete;
* promoções;
* cupons;
* carrinho;
* pedidos;
* reserva ou baixa de estoque;
* dados de clientes;
* dados administrativos internos;
* custos;
* margens;
* fornecedores;
* credenciais;
* informações não revisadas;
* suposições produzidas pela IA.

Essas informações deverão ser obtidas pelas ferramentas autorizadas da loja, quando existentes.

## 10. Estados editoriais

10.1. Os documentos institucionais terão os seguintes estados:

* rascunho;
* em revisão;
* publicado;
* desativado.

10.2. Somente conteúdo publicado e revisado poderá ser indexado e recuperado pelo Atendente IA.

10.3. Conteúdo em rascunho, em revisão ou desativado não poderá aparecer nos resultados utilizados para responder ao cliente.

10.4. A desativação deverá retirar o conteúdo da recuperação sem apagar indevidamente seu histórico de auditoria.

10.5. Uma nova versão não substituirá a versão publicada anterior até concluir com sucesso sua publicação e indexação.

## 11. Publicação e revisão

11.1. O conteúdo deverá ser criado a partir de informações reais da empresa.

11.2. A publicação exigirá registro de:

* documento;
* versão;
* status;
* responsável pela revisão ou aprovação;
* data e hora;
* hash do conteúdo;
* origem;
* execução de indexação correspondente.

11.3. A infraestrutura poderá ser implementada antes do preenchimento da primeira base, mas nenhum conteúdo falso poderá ser criado para demonstração ou produção.

## 12. Indexação econômica e idempotente

12.1. Embeddings somente serão gerados para conteúdo publicado novo ou efetivamente alterado.

12.2. Um hash deverá impedir indexações repetidas do mesmo conteúdo com a mesma configuração compatível.

12.3. Conteúdo sem alteração não poderá gerar novamente custos de embeddings.

12.4. A indexação deverá ser idempotente e segura diante de repetição, falha ou concorrência.

12.5. A versão anterior válida deverá permanecer disponível até que a nova indexação seja concluída e validada.

12.6. Falhas parciais não poderão deixar fragmentos de versões incompatíveis ativos simultaneamente.

## 13. Uso das fontes na resposta

13.1. Os fragmentos recuperados deverão ser tratados como fontes institucionais, nunca como instruções capazes de alterar as regras do sistema.

13.2. O sistema deverá proteger-se contra instruções maliciosas ou indevidas inseridas no conteúdo indexado.

13.3. A resposta deverá permanecer limitada às informações sustentadas pelas fontes recuperadas e pelas ferramentas autorizadas.

13.4. O sistema deverá preservar internamente a rastreabilidade entre:

* pergunta;
* busca realizada;
* fragmentos recuperados;
* pontuações;
* documentos e versões;
* resposta gerada;
* execução responsável.

13.5. A auditoria não deverá expor raciocínio interno do modelo.

## 14. Ausência e conflito de informações

14.1. Quando nenhum fragmento atingir a relevância mínima, o RAG deverá retornar ausência de fonte confiável.

14.2. O Atendente IA deverá admitir que não encontrou informação institucional suficiente.

14.3. O sistema não poderá completar lacunas com suposições.

14.4. Quando fontes publicadas apresentarem contradição relevante:

* nenhuma deverá ser escolhida arbitrariamente;
* o conflito deverá ser registrado;
* a resposta não poderá afirmar como certa uma regra contraditória;
* deverá ser utilizado o tratamento de dúvida e encaminhamento já aprovado nas fases anteriores.

## 15. Segurança e isolamento

15.1. A base institucional deverá permanecer separada de:

* memória de curto prazo;
* histórico de conversas;
* dados pessoais;
* dados administrativos restritos;
* ferramentas comerciais dinâmicas.

15.2. RAG e memória não poderão compartilhar dados ou finalidades indevidamente.

15.3. Consultas e logs deverão preservar somente os dados necessários à rastreabilidade permitida.

15.4. Nenhum conteúdo indexado poderá conter credenciais, dados pessoais desnecessários ou informações internas proibidas.

## 16. Configurações iniciais

Os seguintes parâmetros deverão ser configuráveis sem alteração de código:

* modelo de embeddings;
* dimensão;
* tamanho máximo dos fragmentos;
* sobreposição;
* pesos semântico e textual;
* quantidade de candidatos recuperados;
* quantidade máxima enviada ao modelo;
* relevância mínima;
* limites de contexto;
* estados editoriais permitidos para recuperação.

## 17. Primeira base institucional

17.1. A primeira indexação dependerá da existência de documentos reais, revisados e aprovados.

17.2. A infraestrutura deverá permitir o cadastramento posterior desses documentos.

17.3. Enquanto não houver documentos publicados, o RAG deverá funcionar corretamente como base vazia e retornar ausência de informação confiável.

17.4. A falta de conteúdo inicial não deverá bloquear a implementação nem justificar a criação de informações fictícias.

## 18. Diretriz de testes

A implementação deverá ser validada com testes que comprovem, no mínimo:

* fragmentação e sobreposição;
* preservação das divisões lógicas;
* geração e armazenamento de embeddings;
* compatibilidade de modelo e dimensão;
* busca semântica;
* busca textual;
* combinação dos resultados;
* normalização das pontuações;
* relevância mínima;
* limite de candidatos e fragmentos enviados;
* exclusão de conteúdo não publicado;
* desativação;
* atualização de versão;
* hash e idempotência;
* concorrência;
* preservação da versão anterior diante de falha;
* base vazia;
* ausência de fonte confiável;
* fontes contraditórias;
* prevenção de conteúdo duplicado;
* isolamento entre RAG, memória e dados de clientes;
* proteção contra instruções maliciosas;
* rastreabilidade;
* ausência de chamadas pagas reais nos testes automatizados.

## 19. Encerramento

Este adendo integra oficialmente a Fase 2 e fornece as decisões necessárias para implementar a base institucional e o RAG na Fase 3.

Nenhum fundamento ou decisão anterior é substituído por este adendo.
# TERCEIRO ADENDO OFICIAL DA FASE 2 — FERRAMENTAS PROTEGIDAS E AUTENTICAÇÃO

**Projeto:** Atendente IA da Loja Virtual
**Fase:** 2 — Arquitetura Técnica
**Data de aprovação:** 1º de agosto de 2026
**Status:** Aprovado
**Natureza:** Complemento oficial ao Documento Mestre da Fase 2

## 1. Objetivo

Este adendo define a arquitetura de segurança, autenticação, autorização, confirmação, execução e auditoria das ferramentas que poderão ser utilizadas pelo Atendente IA.

As decisões aqui estabelecidas deverão orientar a implementação correspondente na Fase 3.

Este adendo não substitui nem redefine decisões anteriores das Fases 0, 1 ou 2.

## 2. Princípio central

A autorização de uma operação nunca poderá depender exclusivamente da interpretação ou decisão do modelo de IA.

Cada ferramenta deverá validar, diretamente no servidor:

* identidade autenticada;
* autorização;
* propriedade do recurso;
* estado atual do recurso;
* regras comerciais aplicáveis;
* confirmação exigida;
* parâmetros autorizados;
* proteção contra repetição;
* limites de acesso aos dados.

A IA será apenas a responsável pela comunicação e solicitação controlada das ferramentas. A decisão final de permitir ou bloquear uma operação pertencerá ao sistema determinístico da loja.

## 3. Classificação oficial das ferramentas

Todas as ferramentas disponibilizadas ao Atendente IA deverão pertencer explicitamente a um dos quatro níveis seguintes.

### 3.1. Pública

Ferramenta destinada à consulta de informações públicas, sem necessidade de autenticação.

Exemplos:

* buscar produtos;
* consultar detalhes públicos;
* consultar preços;
* consultar disponibilidade pública;
* consultar promoções públicas;
* calcular opções públicas de entrega;
* consultar retirada;
* recuperar conteúdo institucional publicado.

### 3.2. Autenticada

Ferramenta destinada à consulta de informações particulares do cliente.

Exige:

* sessão válida;
* cliente autenticado;
* validação de propriedade do recurso;
* acesso mínimo aos dados.

Exemplos:

* listar pedidos do cliente;
* consultar detalhes de um pedido;
* acompanhar a situação de um pedido;
* consultar endereços mascarados;
* consultar solicitações pertencentes ao cliente.

### 3.3. Confirmada

Ferramenta que altera dados, cria uma solicitação ou produz efeito real em nome do cliente.

Exige:

* autenticação válida;
* propriedade do recurso;
* elegibilidade da operação;
* confirmação explícita;
* revalidação no momento da execução;
* proteção contra duplicidade;
* auditoria.

Exemplos condicionados à existência e validação do fluxo real da loja:

* solicitar cancelamento de pedido elegível;
* alterar dado permitido;
* selecionar ou alterar endereço quando autorizado;
* criar solicitação formal vinculada ao pedido.

### 3.4. Proibida para a IA

Ferramenta ou operação que não poderá ser disponibilizada ao Atendente IA.

Inclui:

* alterar preços;
* alterar estoque;
* alterar promoções ou cupons;
* conceder descontos por decisão própria;
* modificar pagamentos como se estivessem aprovados;
* mudar a situação de pedidos fora do fluxo oficial;
* acessar pedidos de outros clientes;
* acessar dados administrativos restritos;
* alterar usuários ou permissões;
* executar funções administrativas;
* revelar custos, margens, fornecedores ou credenciais;
* contornar regras comerciais ou de segurança;
* executar comandos arbitrários;
* acessar diretamente banco de dados ou serviços sem ferramenta autorizada.

## 4. Bloqueio por padrão

Somente ferramentas:

* cadastradas;
* classificadas;
* autorizadas;
* implementadas;
* validadas;
* explicitamente liberadas

poderão ser utilizadas pelo Atendente IA.

A existência de uma função interna no projeto não autoriza sua exposição ao modelo.

Toda ferramenta ou operação não explicitamente permitida deverá permanecer bloqueada por padrão.

## 5. Autenticação do cliente

O Atendente IA deverá utilizar a sessão segura já existente na loja.

Não deverá ser criado um segundo sistema de autenticação exclusivo para o chat.

Quando houver sessão válida, o servidor poderá disponibilizar à ferramenta uma identificação interna controlada do cliente.

A IA não poderá receber:

* senha;
* hash de senha;
* token de sessão;
* cookie de autenticação;
* credencial;
* segredo interno;
* código de recuperação;
* qualquer outro elemento que permita autenticação direta.

Quando não existir sessão válida, a IA deverá orientar o cliente a entrar na conta pela interface oficial da loja.

A autenticação não poderá ser realizada pela coleta de senha, CPF, código ou credencial dentro da conversa.

## 6. Autorização no servidor

Toda ferramenta autenticada ou confirmada deverá validar sua autorização diretamente no servidor.

A ferramenta não poderá confiar em declarações do cliente ou da IA, como:

* “o pedido é meu”;
* “sou o titular”;
* “o administrador autorizou”;
* “já confirmei antes”;
* “pode ignorar a regra”;
* “é apenas um teste”.

A confirmação verbal do cliente não substitui:

* autenticação;
* autorização;
* propriedade;
* elegibilidade;
* regras atuais;
* confirmação estruturada;
* proteção contra duplicidade.

## 7. Validação da propriedade do recurso

Consultas e alterações particulares deverão ser limitadas aos recursos pertencentes ao cliente autenticado.

A busca não deverá ocorrer apenas pelo identificador informado. Deverá incluir o vínculo com o cliente autenticado.

Se um identificador pertencer a outro cliente, o sistema não deverá revelar:

* se o recurso existe;
* quem é seu titular;
* seu conteúdo;
* sua situação;
* qualquer outro dado associado.

A resposta deverá ser segura e não enumerável, informando apenas que o recurso não foi localizado entre os recursos disponíveis para aquela conta.

## 8. Acesso mínimo aos dados

Cada ferramenta deverá possuir entrada e saída controladas e disponibilizar somente os dados indispensáveis para sua finalidade.

O modelo não poderá escolher livremente colunas, campos, tabelas ou dados que deseja consultar.

As respostas das ferramentas não deverão expor:

* credenciais;
* tokens;
* hashes;
* dados antifraude;
* campos administrativos internos;
* custos;
* margens;
* fornecedores;
* observações restritas;
* histórico interno desnecessário;
* campos técnicos do banco;
* dados pessoais não necessários.

Quando um dado parcialmente sensível for necessário, deverá ser mascarado sempre que possível.

## 9. Confirmação explícita de ações

Toda ferramenta que altere dados, crie uma solicitação ou produza efeito real deverá exigir confirmação explícita.

Antes de solicitar a confirmação, o Atendente IA deverá informar claramente:

* a ação que será realizada;
* o recurso afetado;
* os parâmetros principais;
* a consequência conhecida da operação.

Exemplo:

“Você está solicitando o cancelamento do pedido nº 1234. Confirma o cancelamento deste pedido?”

Perguntas hipotéticas ou de possibilidade não poderão ser tratadas como ordem de execução.

Exemplos que não representam confirmação:

* “É possível cancelar?”
* “O que acontece se eu cancelar?”
* “Talvez eu queira cancelar.”
* “Quero saber como funciona o cancelamento.”

## 10. Características da confirmação

Cada confirmação deverá ser:

* explícita;
* específica;
* vinculada ao cliente autenticado;
* vinculada à ferramenta;
* vinculada à ação;
* vinculada ao recurso afetado;
* vinculada aos parâmetros principais;
* vinculada à conversa e à execução;
* temporária;
* de uso único;
* auditável.

A validade deverá ser curta e configurável.

A confirmação não poderá ser reutilizada:

* em outra ferramenta;
* em outro pedido;
* em outro recurso;
* com parâmetros alterados;
* em outra conversa;
* depois de utilizada;
* depois de cancelada;
* depois de expirada;
* depois de mudança relevante no estado da operação.

Uma resposta genérica como “sim” somente poderá confirmar a ação quando houver uma confirmação pendente, inequívoca e válida naquela conversa.

## 11. Alteração dos parâmetros confirmados

Se qualquer parâmetro relevante mudar depois da solicitação de confirmação, a confirmação anterior deverá ser invalidada.

A nova operação deverá ser apresentada ao cliente e confirmada novamente.

A confirmação de uma ação não poderá autorizar uma ação semelhante, mais ampla ou diferente.

## 12. Revalidação no momento da execução

Mesmo depois da autenticação e da confirmação, a ferramenta deverá revalidar, imediatamente antes da execução:

* validade da sessão;
* identidade do cliente;
* propriedade do recurso;
* nível de autorização;
* estado atual do recurso;
* elegibilidade da operação;
* regras atuais da loja;
* parâmetros confirmados;
* validade e uso da confirmação;
* eventual execução anterior equivalente.

A confirmação do cliente não poderá contornar as regras reais da loja.

Se a ação era permitida durante a conversa, mas deixou de ser permitida antes da execução, a ferramenta deverá bloqueá-la e informar que a situação mudou.

## 13. Proteção contra execução duplicada

Operações protegidas deverão ser idempotentes.

Cada tentativa deverá possuir um identificador único de idempotência relacionado à operação e à execução.

Repetições provocadas por:

* timeout;
* falha de comunicação;
* repetição do modelo;
* reenvio;
* nova tentativa automática;
* resposta perdida

não poderão produzir o efeito real duas vezes.

Quando a mesma operação já tiver sido concluída, o sistema deverá retornar o resultado anterior ou um estado estruturado equivalente, sem repetir a alteração.

## 14. Resultados estruturados

As ferramentas protegidas deverão retornar resultados claros e estruturados.

Os estados deverão distinguir, quando aplicável:

* concluída;
* bloqueada;
* não autorizada;
* autenticação necessária;
* confirmação necessária;
* confirmação inválida;
* confirmação expirada;
* recurso não encontrado;
* operação não elegível;
* indisponível;
* falha sem execução;
* resultado incerto;
* já executada anteriormente.

A IA não poderá deduzir livremente se uma operação foi concluída.

Quando o resultado for incerto, a IA deverá informar a incerteza e não afirmar que a alteração ocorreu ou deixou de ocorrer.

## 15. Tratamento de falhas

Uma falha confirmada sem execução deverá ser diferenciada de uma falha cujo resultado seja incerto.

O sistema não deverá repetir automaticamente uma operação de resultado incerto como se ela certamente não tivesse sido executada.

A ferramenta deverá preservar rastreabilidade suficiente para:

* verificar o resultado;
* evitar duplicidade;
* permitir tratamento posterior;
* aplicar o encaminhamento já aprovado quando necessário.

## 16. Auditoria

Todas as ferramentas autenticadas e confirmadas deverão produzir registros seguros de auditoria.

A auditoria deverá registrar, quando aplicável:

* ferramenta solicitada;
* classificação de proteção;
* cliente por identificador interno;
* sessão por referência segura;
* autenticação validada ou recusada;
* confirmação solicitada;
* confirmação utilizada;
* recurso afetado;
* parâmetros essenciais permitidos;
* resultado;
* data e hora;
* conversa e execução correspondentes;
* motivo de bloqueio ou falha;
* identificador de idempotência;
* eventual repetição detectada;
* estado de resultado incerto.

A auditoria não deverá armazenar:

* senha;
* token de sessão completo;
* cookie;
* credenciais;
* segredos;
* dados pessoais desnecessários;
* raciocínio interno do modelo.

## 17. Ferramentas públicas iniciais

Poderão ser disponibilizadas progressivamente, desde que exista implementação real e validada:

* busca de produtos;
* detalhes públicos do produto;
* variantes;
* disponibilidade pública;
* preços atuais;
* promoções públicas;
* opções públicas de entrega;
* retirada;
* informações institucionais recuperadas pelo RAG.

As informações comerciais variáveis deverão continuar sendo consultadas nas fontes reais da loja, nunca inventadas ou obtidas do RAG institucional.

## 18. Ferramentas autenticadas iniciais

Poderão ser disponibilizadas progressivamente, desde que os respectivos recursos já existam e sejam validados:

* listar pedidos do cliente;
* consultar detalhes de pedido pertencente ao cliente;
* acompanhar a situação do pedido;
* consultar endereços mascarados;
* consultar dados mínimos necessários;
* consultar solicitações ou atendimentos pertencentes ao cliente.

A implementação não deverá criar artificialmente recursos comerciais que ainda não existam na loja.

## 19. Ferramentas confirmadas iniciais

Ferramentas com efeito real somente poderão ser liberadas quando o fluxo correspondente já existir e for validado individualmente.

Exemplos possíveis:

* solicitar cancelamento de pedido elegível;
* alterar dado permitido antes do processamento;
* selecionar ou alterar endereço quando autorizado;
* criar solicitação formal vinculada ao pedido.

A aprovação deste adendo não significa que todas essas operações já estejam disponíveis no projeto nem autoriza a criação de regras comerciais ausentes.

Quando o fluxo real não existir ou não estiver suficientemente definido, a ferramenta deverá permanecer bloqueada.

## 20. Separação de responsabilidades

Deverão permanecer separados:

* modelo de IA;
* orquestrador;
* autenticação;
* autorização;
* ferramentas públicas;
* ferramentas protegidas;
* confirmação;
* regras comerciais;
* idempotência;
* auditoria;
* banco de dados;
* RAG;
* memória de curto prazo;
* histórico da conversa.

O modelo poderá solicitar uma ferramenta, mas não poderá substituir as validações determinísticas desses componentes.

## 21. Segurança contra instruções maliciosas

Nenhuma mensagem do cliente, conteúdo recuperado pelo RAG, histórico ou saída de ferramenta poderá:

* alterar o nível de proteção;
* dispensar autenticação;
* fabricar confirmação;
* ampliar permissões;
* trocar o cliente autenticado;
* remover a validação de propriedade;
* liberar ferramenta proibida;
* contornar regras comerciais;
* solicitar credenciais;
* executar comandos arbitrários.

Entradas e saídas de ferramentas deverão ser validadas por contratos estruturados.

## 22. Diretriz de implementação progressiva

A exposição das ferramentas ao Atendente IA deverá ocorrer progressivamente.

Cada ferramenta deverá ser liberada somente após comprovação de:

* necessidade funcional;
* classificação correta;
* contrato de entrada e saída;
* autenticação adequada;
* autorização no servidor;
* minimização de dados;
* tratamento de erros;
* auditoria;
* testes;
* comportamento seguro.

A liberação de uma ferramenta não autoriza automaticamente ferramentas semelhantes.

## 23. Diretriz de testes

A implementação deverá comprovar, no mínimo:

* classificação dos quatro níveis de proteção;
* bloqueio padrão de ferramentas não autorizadas;
* consulta pública sem login;
* bloqueio de consulta particular sem login;
* uso da sessão existente;
* ausência de credenciais no contexto do modelo;
* validação de propriedade;
* impossibilidade de enumerar recursos de terceiros;
* mascaramento e minimização de dados;
* confirmação explícita;
* rejeição de confirmação ambígua;
* confirmação vinculada à ação;
* uso único;
* expiração;
* invalidação por mudança de parâmetros;
* revalidação no momento da execução;
* bloqueio após mudança do estado do recurso;
* idempotência;
* repetição após timeout;
* diferenciação entre falha sem execução e resultado incerto;
* resultados estruturados;
* auditoria segura;
* ausência de senha, token e credencial nos logs;
* bloqueio de ferramentas proibidas;
* proteção contra instruções maliciosas;
* separação entre RAG, memória e ferramentas;
* ausência de chamadas reais indevidas;
* preservação das regras atuais da loja.

## 24. Fora do escopo deste adendo

Não pertencem a este adendo:

* criação de novas regras comerciais;
* criação artificial de fluxos de cancelamento;
* criação de operações inexistentes na loja;
* painel administrativo completo de ferramentas;
* interface pública final do chat;
* transferência efetiva para atendente humano;
* memória de longo prazo;
* redefinição do RAG;
* alteração dos fundamentos comportamentais;
* execução de funções administrativas pela IA.

## 25. Encerramento

Este adendo integra oficialmente a Fase 2 e estabelece as decisões necessárias para implementar ferramentas protegidas e autenticação na Fase 3.

Nenhum fundamento ou decisão anterior é substituído por este adendo.
