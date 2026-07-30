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

`src/features/ai-assistant`

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
| Arquitetura          | Domínio modular em `src/features/ai-assistant`                 |
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


