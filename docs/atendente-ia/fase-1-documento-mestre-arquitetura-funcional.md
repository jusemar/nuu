# DOCUMENTO MESTRE DA FASE 1 — ARQUITETURA FUNCIONAL DO ATENDENTE IA

**Status:** Em validação

---

# 1. FINALIDADE DO DOCUMENTO

Este documento consolida as decisões aprovadas durante a **Fase 1 — Arquitetura Funcional do Atendente IA** da loja virtual.

A Fase 1 teve como finalidade traduzir os fundamentos comportamentais, éticos e operacionais aprovados na Fase 0 em uma arquitetura funcional clara, capaz de orientar o funcionamento futuro do Atendente IA.

Este documento define:

* os blocos funcionais do Atendente IA;
* o fluxo de processamento de uma mensagem;
* os principais tipos de intenção;
* a organização do contexto e da memória;
* a classificação funcional das ferramentas;
* o funcionamento do motor consultivo e de recomendação;
* as fontes oficiais de informação;
* os níveis de autonomia e permissão;
* as regras de transferência para atendimento humano;
* o tratamento de falhas e exceções;
* os requisitos funcionais de segurança e privacidade;
* os critérios de observabilidade e qualidade.

Este documento não redefine os fundamentos da Fase 0.

Também não define:

* arquitetura técnica;
* tecnologias;
* modelos de inteligência artificial;
* APIs;
* banco de dados;
* schemas;
* componentes;
* código;
* implementação de ferramentas;
* contratos técnicos;
* decisões próprias da Fase 2.

---

# 2. PREMISSAS DA ARQUITETURA FUNCIONAL

## 2.1 Natureza do Atendente IA

O Atendente IA deverá funcionar como um consultor da loja, e não apenas como um chatbot de respostas prontas.

A arquitetura funcional deverá permitir que ele:

* compreenda a necessidade do cliente;
* interprete o contexto;
* identifique informações faltantes;
* consulte fontes oficiais;
* selecione capacidades adequadas;
* combine resultados;
* produza respostas naturais;
* apresente recomendações fundamentadas;
* reconheça limitações;
* respeite os limites de autonomia;
* transfira o atendimento quando necessário;
* preserve o contexto da conversa.

## 2.2 IA como cérebro e ferramentas como capacidades da loja

Foi aprovado o conceito de que a IA será responsável pelo raciocínio funcional do atendimento, enquanto as ferramentas serão responsáveis pelas consultas e ações específicas nos sistemas da loja.

A IA será responsável por:

* compreender a intenção;
* interpretar o contexto;
* decidir quais informações precisa;
* selecionar a ferramenta adequada;
* combinar resultados;
* produzir uma resposta natural;
* reconhecer quando precisa de atendimento humano.

As ferramentas serão responsáveis por consultar ou executar capacidades específicas e controladas da loja.

## 2.3 Separação de responsabilidades

A arquitetura deverá separar claramente quatro responsabilidades:

### 2.3.1 Compreender

Identificar o que o cliente deseja e quais informações já foram fornecidas.

### 2.3.2 Decidir

Escolher se deve:

* responder;
* perguntar;
* consultar;
* recomendar;
* simular;
* preparar uma ação;
* pedir confirmação;
* executar;
* transferir.

### 2.3.3 Consultar ou agir

Utilizar apenas capacidades autorizadas e fontes oficiais.

### 2.3.4 Responder

Apresentar ao cliente uma resposta natural, fundamentada e adequada ao contexto.

Essa separação deverá reduzir o risco de a IA interpretar uma solicitação e responder imediatamente com uma informação não confirmada.

---

# 3. ARQUITETURA FUNCIONAL GERAL

## 3.1 Objetivo da arquitetura funcional geral

A arquitetura funcional geral define os grandes blocos responsáveis pelo funcionamento do Atendente IA e estabelece:

* o papel de cada bloco;
* quais decisões pertencem a cada um;
* como as informações circulam entre eles;
* onde se aplicam segurança, privacidade e limites de autonomia;
* como evitar respostas ou ações sem base confiável.

Foram aprovados nove blocos funcionais principais.

---

# 4. BLOCO 1 — CANAIS E INTERFACE DE ATENDIMENTO

## 4.1 Finalidade

Os canais e a interface de atendimento representam o ponto de contato entre o cliente e o Atendente IA.

O Atendente IA poderá futuramente atuar por meio de:

* chat da loja;
* WhatsApp;
* outros canais autorizados.

## 4.2 Responsabilidades

Este bloco será responsável por:

* receber a mensagem do cliente;
* identificar o canal;
* identificar a sessão;
* encaminhar a mensagem ao núcleo do atendimento;
* exibir as respostas;
* apresentar solicitações de confirmação;
* permitir a transferência para atendimento humano.

## 4.3 Limites

Este bloco não deverá:

* decidir recomendações;
* consultar diretamente os dados da loja;
* executar ações;
* definir permissões;
* produzir respostas comerciais por conta própria.

---

# 5. BLOCO 2 — ORQUESTRADOR DA CONVERSA

## 5.1 Finalidade

O orquestrador será o coordenador central do atendimento.

## 5.2 Responsabilidades

O orquestrador deverá:

* receber a mensagem encaminhada pelo canal;
* recuperar o contexto disponível;
* acionar os demais blocos na ordem adequada;
* coordenar o processamento da solicitação;
* decidir qual bloco deverá atuar em cada momento;
* impedir respostas antes das validações necessárias;
* controlar o ciclo entre pergunta, consulta, resposta, ação e transferência.

## 5.3 Limites

O orquestrador não deverá concentrar todas as regras do sistema.

Sua função será coordenar os blocos especializados, e não substituir:

* a compreensão da solicitação;
* o mecanismo de decisão;
* as regras de segurança;
* o motor de recomendação;
* as ferramentas;
* as fontes oficiais.

---

# 6. BLOCO 3 — COMPREENSÃO DA SOLICITAÇÃO

## 6.1 Finalidade

Este bloco interpretará o que o cliente realmente deseja.

## 6.2 Responsabilidades

Deverá:

* identificar a intenção principal;
* reconhecer intenções secundárias relevantes;
* extrair informações fornecidas pelo cliente;
* identificar critérios;
* identificar restrições;
* reconhecer preferências;
* detectar dúvida;
* detectar indecisão;
* detectar objeção;
* detectar reclamação;
* detectar solicitação de atendimento humano;
* indicar quais informações necessárias ainda estão faltando.

## 6.3 Limites

Este bloco será responsável por interpretar, mas não por inventar ou confirmar respostas.

A identificação de uma provável necessidade não deverá ser tratada como fato confirmado.

## 6.4 Exemplo aprovado

Mensagem do cliente:

> Esse notebook serve para estudar e jogar?

A compreensão da solicitação deverá reconhecer que a mensagem pode envolver:

* dúvida sobre o produto;
* compatibilidade com o uso;
* possível necessidade de recomendação;
* necessidade de conhecer os jogos ou o nível de desempenho esperado.

---

# 7. BLOCO 4 — CONTEXTO E CONTINUIDADE

## 7.1 Finalidade

Este bloco manterá somente as informações necessárias para que a conversa tenha continuidade.

## 7.2 Responsabilidades

Deverá:

* preservar o histórico relevante da conversa;
* registrar necessidades já informadas;
* registrar critérios já informados;
* evitar repetição de perguntas;
* manter informações temporárias da sessão;
* permitir continuidade entre canais quando autorizada;
* definir quando uma informação deve ser descartada;
* impedir que dados irrelevantes ou excessivos sejam mantidos.

## 7.3 Separação obrigatória das informações

O contexto deverá distinguir:

* informação declarada pelo cliente;
* informação confirmada pelos sistemas;
* inferência provisória da IA;
* ação solicitada;
* ação pendente;
* ação realmente concluída;
* informação vencida ou possivelmente desatualizada.

Essa separação será obrigatória para reduzir:

* contradições;
* falsas confirmações;
* interpretações equivocadas;
* uso inadequado de informações.

---

# 8. BLOCO 5 — MECANISMO DE DECISÃO

## 8.1 Finalidade

O mecanismo de decisão escolherá o próximo passo do atendimento.

## 8.2 Possíveis decisões

O mecanismo poderá decidir entre:

* responder diretamente;
* fazer uma pergunta necessária;
* consultar uma fonte da loja;
* comparar informações;
* preparar uma recomendação;
* simular;
* preparar uma ação;
* solicitar confirmação;
* executar uma ação autorizada;
* informar uma limitação;
* transferir para atendimento humano.

## 8.3 Critérios de decisão

A decisão deverá considerar:

* intenção do cliente;
* contexto disponível;
* dados faltantes;
* necessidade de informação atual;
* nível de risco;
* permissões;
* confiança nos resultados;
* regras aprovadas na Fase 0.

## 8.4 Regra para perguntas

A IA deverá perguntar somente quando a resposta realmente depender da informação que falta.

Exemplo aprovado:

> Quero um notebook para trabalhar.

Nesse caso, poderá ser necessário perguntar qual tipo de trabalho será realizado.

Outro exemplo aprovado:

> Qual é o preço deste notebook?

Se o produto estiver identificado, a IA deverá consultar o preço sem criar perguntas adicionais.

---

# 9. BLOCO 6 — CATÁLOGO DE CAPACIDADES E FERRAMENTAS

## 9.1 Finalidade

Este bloco representará tudo aquilo que o Atendente IA poderá consultar ou executar nos sistemas da loja.

## 9.2 Organização funcional

As capacidades poderão abranger grupos como:

* catálogo e produtos;
* preços e modalidades;
* estoque e variantes;
* promoções e cupons;
* entrega e prazo;
* pedidos;
* carrinho;
* políticas;
* atendimento humano.

## 9.3 Requisitos funcionais de cada capacidade

Cada capacidade deverá declarar:

* sua finalidade;
* quais dados exige;
* quais dados recebe;
* quais dados retorna;
* qual sistema é a fonte oficial;
* se apenas consulta;
* se simula;
* se executa uma ação;
* quais permissões exige;
* se necessita de confirmação;
* como comprova a execução;
* quais erros pode retornar;
* como deverá tratar falhas;
* quais dados poderão ser registrados.

## 9.4 Regra de acesso

A IA não deverá acessar diretamente:

* banco de dados;
* tabelas;
* APIs externas;
* serviços internos;
* informações administrativas.

Todo acesso deverá ocorrer por meio de uma capacidade definida, controlada e autorizada.

---

# 10. BLOCO 7 — MOTOR CONSULTIVO E DE RECOMENDAÇÃO

## 10.1 Finalidade

O motor consultivo transformará necessidades do cliente e dados confirmados em orientações fundamentadas.

## 10.2 Responsabilidades

Deverá:

* organizar os critérios do cliente;
* buscar opções compatíveis;
* eliminar opções inadequadas;
* comparar benefícios e limitações;
* considerar preço;
* considerar modalidade;
* considerar variante;
* considerar estoque;
* considerar promoção;
* considerar entrega;
* justificar a recomendação;
* reconhecer quando não houver produto adequado.

## 10.3 Limites comerciais

O motor não deverá classificar produtos apenas por:

* maior preço;
* maior margem;
* maior comissão;
* promoção;
* necessidade comercial de vender determinado item.

Critérios comerciais somente poderão participar quando não prejudicarem a necessidade real do cliente e forem apresentados com transparência.

---

# 11. BLOCO 8 — GOVERNANÇA, SEGURANÇA E VALIDAÇÃO

## 11.1 Finalidade

Este bloco será uma camada transversal que acompanhará toda a conversa.

Não deverá existir apenas como revisão final da resposta.

## 11.2 Responsabilidades

Deverá:

* verificar se uma afirmação possui fonte válida;
* impedir que uma suposição seja apresentada como fato;
* aplicar limites de autonomia;
* verificar permissões;
* proteger dados pessoais;
* controlar ações sensíveis;
* detectar manipulação;
* detectar pressão comercial;
* detectar urgência falsa;
* revisar respostas antes do envio;
* impedir exposição indevida de dados;
* exigir confirmação real antes de afirmar que uma ação foi concluída.

## 11.3 Atuação transversal

A governança, segurança e validação deverão atuar:

* antes das consultas;
* durante as consultas;
* antes das ações;
* durante as ações;
* durante a construção da resposta;
* antes do envio ao cliente;
* durante o registro do atendimento.

---

# 12. BLOCO 9 — ATENDIMENTO HUMANO, REGISTRO E QUALIDADE

## 12.1 Finalidade

Este bloco reunirá funções relacionadas à continuidade operacional e ao acompanhamento da qualidade.

## 12.2 Transferência para atendimento humano

Será responsável por:

* identificar quando o encaminhamento é necessário;
* evitar transferências prematuras;
* preparar o resumo do atendimento;
* preservar o contexto;
* preservar os dados relevantes;
* preservar as tentativas realizadas;
* informar o motivo da transferência;
* permitir retomada posterior sem reiniciar a conversa.

## 12.3 Registro operacional

O registro poderá conter:

* intenção identificada;
* consultas realizadas;
* fontes utilizadas;
* resultados recebidos;
* ações solicitadas;
* confirmações;
* falhas;
* transferências;
* resposta final.

O registro deverá evitar dados pessoais desnecessários.

## 12.4 Avaliação de qualidade e evolução controlada

Este bloco poderá identificar:

* respostas sem fonte;
* falhas recorrentes;
* perguntas repetidas;
* lacunas de conhecimento;
* transferências desnecessárias;
* contradições;
* solicitações não resolvidas;
* oportunidades de melhoria.

O bloco poderá propor alterações, mas não deverá modificar automaticamente regras críticas.

---

# 13. RELACIONAMENTO ENTRE OS BLOCOS

## 13.1 Fluxo estrutural geral

O relacionamento geral aprovado será:

**Cliente e canal**

↓
**Orquestrador**

↓
**Compreensão da solicitação**

↔ **Contexto e continuidade**

↓
**Mecanismo de decisão**

↓

Conforme a necessidade:

* consultar capacidades e ferramentas;
* acionar o motor consultivo e de recomendação;
* solicitar informação ao cliente;
* pedir confirmação;
* transferir para humano.

Durante todo o processo:

**Governança, segurança e validação** supervisionarão decisões, dados, consultas, ações e respostas.

Ao final:

**Registro e qualidade** documentarão o atendimento e produzirão informações para evolução controlada.

---

# 14. FLUXO FUNCIONAL COMPLETO DE UMA MENSAGEM

## 14.1 Objetivo

O fluxo funcional define o caminho de uma mensagem desde o envio pelo cliente até a resposta final.

## 14.2 Etapa 1 — Receber a mensagem

O sistema deverá:

* receber o conteúdo;
* identificar o canal;
* identificar a sessão;
* encaminhar a mensagem para o orquestrador.

## 14.3 Etapa 2 — Recuperar o contexto

O sistema deverá verificar:

* o que já foi informado;
* quais perguntas já foram respondidas;
* quais produtos já foram discutidos;
* quais consultas já foram realizadas;
* quais ações estão pendentes;
* quais informações podem estar desatualizadas.

O objetivo será evitar repetição e manter continuidade.

## 14.4 Etapa 3 — Compreender a solicitação

O sistema deverá identificar:

* o que o cliente deseja;
* a intenção principal;
* intenções secundárias;
* critérios informados;
* restrições;
* preferências;
* possíveis ambiguidades.

## 14.5 Etapa 4 — Identificar informações faltantes

O sistema deverá avaliar se já existem dados suficientes para continuar.

Quando faltar uma informação indispensável, deverá identificar exatamente qual dado está ausente.

## 14.6 Etapa 5 — Escolher o próximo passo

O sistema deverá decidir entre:

* responder diretamente;
* fazer uma pergunta;
* consultar informações da loja;
* preparar uma recomendação;
* simular;
* preparar uma ação;
* solicitar confirmação;
* executar;
* encaminhar para humano.

## 14.7 Etapa 6 — Consultar fontes oficiais

Quando a resposta depender de informações atuais, o sistema deverá consultar as fontes oficiais.

Informações como:

* preço;
* estoque;
* promoção;
* prazo;
* disponibilidade;
* situação de pedido;
* condição comercial;
* política;

não poderão ser apresentadas como atuais sem consulta à fonte responsável.

## 14.8 Etapa 7 — Validar os resultados

Após a consulta, o sistema deverá verificar:

* se a consulta foi concluída;
* se os dados estão completos;
* se os resultados são compatíveis;
* se há divergência;
* se a fonte é adequada;
* se a informação ainda é válida;
* se existe risco de resposta incorreta.

## 14.9 Etapa 8 — Construir a resposta

A resposta deverá:

* resolver primeiro o que foi perguntado;
* explicar apenas o necessário;
* diferenciar fatos;
* diferenciar estimativas;
* diferenciar recomendações;
* diferenciar limitações;
* informar divergências relevantes;
* evitar excesso de informações.

## 14.10 Etapa 9 — Aplicar validação final

Antes do envio, o sistema deverá verificar:

* se existe informação sem fonte;
* se existe promessa indevida;
* se alguma limitação relevante foi omitida;
* se houve pressão comercial;
* se houve urgência falsa;
* se foram solicitados dados desnecessários;
* se uma ação foi apresentada como concluída sem confirmação;
* se existe exposição indevida de dados.

## 14.11 Etapa 10 — Enviar e registrar

A resposta será enviada ao cliente.

Serão registrados apenas os dados necessários para:

* continuidade;
* auditoria;
* segurança;
* melhoria.

## 14.12 Retornos dentro do fluxo

O fluxo não será obrigatoriamente linear.

Após uma consulta, o sistema poderá descobrir que ainda falta uma informação e retornar à etapa de pergunta.

Após uma nova informação do cliente, poderá ser necessário:

* reinterpretar a intenção;
* atualizar o contexto;
* realizar nova consulta;
* alterar uma recomendação;
* solicitar nova confirmação.

## 14.13 Síntese do fluxo aprovado

O fluxo funcional aprovado será:

**receber → recuperar contexto → compreender → identificar o que falta → decidir → perguntar ou consultar → validar → responder → registrar → transferir quando necessário.**

---

# 15. TIPOS PRINCIPAIS DE INTENÇÃO

## 15.1 Objetivo

As intenções representam os principais motivos pelos quais um cliente poderá conversar com o Atendente IA.

Foram aprovados oito grupos principais.

---

# 16. INTENÇÃO 1 — DESCOBERTA E RECOMENDAÇÃO

## 16.1 Definição

Aplica-se quando o cliente ainda procura uma solução ou não sabe exatamente qual produto escolher.

## 16.2 Exemplos aprovados

> Preciso de um notebook para trabalhar.

> Qual pneu serve melhor para minha moto?

> Quero um presente de até R$ 200,00.

## 16.3 Comportamento funcional

A IA deverá:

* compreender a necessidade;
* levantar apenas os critérios necessários;
* consultar opções;
* filtrar incompatíveis;
* recomendar alternativas adequadas;
* explicar a recomendação;
* reconhecer quando não houver opção adequada.

---

# 17. INTENÇÃO 2 — INFORMAÇÃO SOBRE PRODUTO

## 17.1 Definição

Aplica-se quando o cliente pergunta sobre um produto já identificado.

## 17.2 Possíveis assuntos

Pode envolver:

* características;
* funcionamento;
* medidas;
* garantia;
* compatibilidade;
* conteúdo da embalagem;
* diferenças entre variantes.

## 17.3 Regra funcional

A resposta deverá utilizar informações oficiais do produto.

Quando a informação não estiver disponível ou confirmada, a IA deverá reconhecer a limitação.

---

# 18. INTENÇÃO 3 — COMPARAÇÃO

## 18.1 Definição

Aplica-se quando o cliente deseja comparar:

* produtos;
* variantes;
* modalidades;
* alternativas de compra.

## 18.2 Exemplos aprovados

> Qual desses dois é melhor para jogos?

> Vale a pena pagar mais neste modelo?

## 18.3 Comportamento funcional

A comparação deverá:

* considerar os critérios relevantes para o cliente;
* apresentar vantagens;
* apresentar limitações;
* explicar diferenças práticas;
* evitar apenas listar especificações;
* indicar em qual situação cada opção é mais adequada.

---

# 19. INTENÇÃO 4 — CONDIÇÕES COMERCIAIS

## 19.1 Definição

Agrupa dúvidas relacionadas a:

* preço;
* modalidade de preço;
* promoção;
* cupom;
* forma de pagamento;
* disponibilidade;
* estoque;
* variante disponível.

## 19.2 Regra funcional

Essas informações deverão ser consultadas nas fontes atuais da loja.

A IA não deverá utilizar memória própria para responder sobre condições comerciais atuais.

---

# 20. INTENÇÃO 5 — ENTREGA E DISPONIBILIDADE LOGÍSTICA

## 20.1 Definição

Inclui:

* cálculo de frete;
* prazo;
* retirada;
* região atendida;
* restrição logística;
* entrega própria;
* acompanhamento da entrega.

## 20.2 Solicitação de dados

A IA poderá solicitar o CEP quando necessário.

Ao solicitar, deverá explicar brevemente a finalidade.

Exemplo aprovado:

> Qual é o seu CEP? Vou usá-lo para consultar as opções e o prazo de entrega.

---

# 21. INTENÇÃO 6 — COMPRA E CARRINHO

## 21.1 Definição

Aplica-se quando o cliente deseja avançar na compra ou precisa de ajuda durante o processo.

## 21.2 Possíveis solicitações

Pode incluir:

* adicionar produto ao carrinho;
* selecionar variante;
* alterar quantidade;
* recuperar carrinho;
* compreender o checkout;
* resolver impedimento antes da finalização.

## 21.3 Regra funcional

A IA deverá distinguir orientação de ação real.

Somente poderá afirmar que alterou o carrinho ou executou outra ação quando houver confirmação do sistema.

---

# 22. INTENÇÃO 7 — PEDIDO E PÓS-VENDA

## 22.1 Definição

Agrupa solicitações realizadas depois da compra.

## 22.2 Possíveis assuntos

Inclui:

* situação do pedido;
* pagamento;
* rastreamento;
* atraso;
* troca;
* devolução;
* cancelamento;
* garantia;
* produto incorreto;
* produto danificado;
* reclamação.

## 22.3 Regra funcional

Alguns casos poderão ser resolvidos pela IA.

Outros dependerão de:

* confirmação adicional;
* autorização;
* aprovação;
* encaminhamento humano.

---

# 23. INTENÇÃO 8 — ATENDIMENTO GERAL E EXCEÇÕES

## 23.1 Definição

Inclui situações que não pertencem diretamente aos demais grupos.

## 23.2 Possíveis casos

* políticas da loja;
* contato;
* horários;
* solicitação de atendimento humano;
* mensagem sem intenção clara;
* conversa fora do escopo;
* conteúdo ofensivo ou inadequado;
* solicitação que a IA não está autorizada a atender.

## 23.3 Regra funcional

A IA deverá orientar com respeito, sem inventar respostas e sem transformar o assunto em tentativa de venda.

---

# 24. INTENÇÃO PRINCIPAL E INTENÇÃO SECUNDÁRIA

## 24.1 Regra

Uma mesma mensagem poderá conter mais de uma intenção.

## 24.2 Exemplo aprovado

> Esse notebook está disponível e chega até sexta-feira?

A mensagem envolve:

* disponibilidade e estoque;
* entrega e prazo.

A arquitetura deverá permitir reconhecer ambas, mantendo prioridade clara para evitar respostas confusas.

---

# 25. MUDANÇA DE INTENÇÃO

## 25.1 Regra

A intenção não permanecerá fixa durante todo o atendimento.

## 25.2 Exemplo aprovado

O cliente poderá:

1. começar pedindo uma recomendação;
2. escolher um produto;
3. perguntar o preço;
4. consultar o frete;
5. decidir comprar.

O contexto deverá acompanhar essa evolução sem tratar cada mensagem como uma conversa isolada.

---

# 26. CASOS AMBÍGUOS

## 26.1 Regra

Quando a intenção não estiver clara, a IA deverá fazer uma pergunta curta e diretamente relacionada à necessidade.

## 26.2 Exemplo aprovado

Cliente:

> Preciso de uma peça para meu carro.

Resposta adequada:

> Qual é o modelo, ano e motorização do veículo?

A IA não deverá perguntar ao cliente qual é a intenção dele.

Deverá esclarecer a necessidade de maneira natural.

---

# 27. CONTEXTO E MEMÓRIA DO ATENDIMENTO

## 27.1 Objetivo

O contexto e a memória deverão permitir continuidade sem repetição de perguntas e sem armazenamento desnecessário.

Foram aprovados quatro níveis.

---

# 28. NÍVEL 1 — CONTEXTO DA MENSAGEM ATUAL

## 28.1 Definição

Contém apenas o que o cliente acabou de informar.

## 28.2 Exemplos

Pode incluir:

* produto mencionado;
* dúvida feita;
* CEP informado;
* modelo do veículo;
* limite de preço;
* preferência declarada.

## 28.3 Finalidade

Servirá para interpretar a mensagem atual.

---

# 29. NÍVEL 2 — CONTEXTO DA CONVERSA

## 29.1 Definição

Mantém as informações necessárias enquanto o atendimento estiver em andamento.

## 29.2 Possíveis informações

* intenção atual;
* produtos analisados;
* critérios informados;
* perguntas já respondidas;
* comparações realizadas;
* resultados de consultas;
* ações pendentes;
* limitações já explicadas.

## 29.3 Finalidade

Evitar:

* repetição;
* contradição;
* perda de continuidade;
* necessidade de o cliente explicar novamente.

---

# 30. NÍVEL 3 — CONTEXTO TEMPORÁRIO DA SESSÃO

## 30.1 Definição

Pode continuar disponível por período limitado, mesmo que o cliente saia da página e retorne.

## 30.2 Exemplos

Pode incluir:

* produto que estava avaliando;
* carrinho em andamento;
* CEP usado recentemente;
* comparação ainda não concluída;
* atendimento interrompido.

## 30.3 Regra

Esse contexto deverá expirar quando deixar de ser útil.

---

# 31. NÍVEL 4 — HISTÓRICO AUTORIZADO DO CLIENTE

## 31.1 Definição

Contém somente informações que realmente ajudam em atendimentos futuros e que podem ser mantidas de acordo com a finalidade informada.

## 31.2 Exemplos possíveis

* pedidos anteriores;
* endereços cadastrados;
* preferências declaradas e relevantes;
* atendimentos anteriores relacionados a problema ainda aberto;
* consentimentos;
* recusas.

## 31.3 Limite

A IA não deverá transformar toda conversa em memória permanente.

---

# 32. CLASSIFICAÇÃO DAS INFORMAÇÕES NO CONTEXTO

## 32.1 Categorias obrigatórias

Cada informação deverá ser classificada como:

* informada pelo cliente;
* confirmada pelo sistema da loja;
* inferida provisoriamente pela IA;
* ação solicitada;
* ação confirmada como concluída;
* informação vencida;
* informação possivelmente desatualizada.

## 32.2 Exemplo aprovado

Se o cliente disser:

> Acho que meu pedido foi cancelado.

Isso não significa que o pedido está cancelado.

A declaração deverá permanecer classificada como informação fornecida pelo cliente até que o sistema confirme o status.

---

# 33. PREFERÊNCIAS DO CLIENTE

## 33.1 Condições para manutenção

Uma preferência somente deverá ser mantida quando:

* for declarada claramente;
* possuir utilidade futura;
* não for excessivamente pessoal;
* não criar risco de uso inadequado;
* puder ser corrigida;
* puder ser removida pelo cliente.

## 33.2 Exemplo adequado

> Prefiro opções de até R$ 500,00.

## 33.3 Exemplo inadequado

Guardar permanentemente informação emocional dita durante uma reclamação para influenciar vendas futuras.

---

# 34. DADOS QUE NÃO DEVEM SER MEMORIZADOS SEM NECESSIDADE

A arquitetura deverá evitar manter:

* emoções passageiras;
* informações de saúde;
* dificuldades financeiras;
* conflitos pessoais;
* dados de terceiros;
* documentos completos;
* senhas;
* códigos de autenticação;
* dados de pagamento;
* informações sem relação com o atendimento.

Quando algum dado sensível precisar ser utilizado, deverá permanecer disponível pelo menor tempo necessário.

---

# 35. REGRAS PARA ESQUECIMENTO

Uma informação deverá ser removida ou deixar de influenciar o atendimento quando:

* a finalidade tiver sido concluída;
* tiver perdido validade;
* o cliente tiver corrigido a informação;
* o cliente tiver pedido remoção;
* o período de retenção tiver terminado;
* não possuir mais relação com o atendimento;
* tiver sido apenas uma inferência não confirmada.

---

# 36. CONTINUIDADE ENTRE CANAIS

## 36.1 Regra

A continuidade entre site, WhatsApp ou outros canais somente deverá ocorrer quando existir:

* identificação segura do cliente;
* autorização adequada para relacionar os atendimentos.

## 36.2 Limite

A IA deverá transferir entre canais apenas o contexto necessário.

Não deverá copiar automaticamente todo o histórico.

---

# 37. RESUMO ESTRUTURADO DE CONTEXTO

## 37.1 Finalidade

Para conversas longas, o sistema deverá manter um resumo estruturado.

## 37.2 Conteúdo possível

O resumo poderá conter:

* necessidade atual;
* critérios importantes;
* fatos confirmados;
* produtos discutidos;
* decisões do cliente;
* pendências;
* última ação realizada;
* próximo passo possível.

## 37.3 Regra

O resumo deverá preservar fatos importantes sem exigir o armazenamento indefinido de cada mensagem.

---

# 38. FERRAMENTAS E SKILLS

## 38.1 Objetivo

As ferramentas permitirão consultar informações e executar ações sem que a IA acesse diretamente os sistemas ou ultrapasse suas permissões.

Foram aprovados quatro grupos funcionais.

---

# 39. GRUPO 1 — FERRAMENTAS DE CONSULTA

## 39.1 Finalidade

Servem apenas para buscar informações.

## 39.2 Exemplos futuros aprovados

* consultar produto;
* verificar preço;
* consultar estoque;
* buscar variantes;
* verificar promoção;
* calcular entrega;
* consultar pedido;
* consultar política da loja.

## 39.3 Limite

Essas ferramentas não alteram informações.

---

# 40. GRUPO 2 — FERRAMENTAS DE SIMULAÇÃO

## 40.1 Finalidade

Calculam ou preparam um resultado sem executar alteração definitiva.

## 40.2 Exemplos futuros aprovados

* simular frete;
* comparar produtos;
* calcular valor estimado;
* verificar compatibilidade;
* montar sugestão de carrinho.

## 40.3 Regra

A IA deverá informar claramente quando o resultado for apenas uma simulação.

---

# 41. GRUPO 3 — FERRAMENTAS DE AÇÃO

## 41.1 Finalidade

Alteram alguma informação ou iniciam uma operação real.

## 41.2 Exemplos futuros aprovados

* adicionar item ao carrinho;
* alterar quantidade;
* aplicar cupom;
* cancelar uma solicitação;
* registrar atendimento;
* encaminhar para humano.

## 41.3 Regra

Essas ferramentas deverão possuir controle superior ao das ferramentas de consulta.

---

# 42. GRUPO 4 — FERRAMENTAS INTERNAS DE APOIO

## 42.1 Finalidade

Ajudam o funcionamento interno do atendimento.

## 42.2 Exemplos futuros aprovados

* recuperar contexto;
* registrar resumo;
* validar permissões;
* verificar identidade;
* registrar falha;
* preparar transferência para humano.

## 42.3 Visibilidade

O cliente não precisará conhecer os detalhes internos dessas ferramentas.

---

# 43. REQUISITOS DE CADA FERRAMENTA

Cada ferramenta deverá informar:

* finalidade;
* dados recebidos;
* dados retornados;
* fonte oficial;
* classificação entre consulta, simulação, ação ou apoio;
* permissões exigidas;
* necessidade de confirmação;
* erros possíveis;
* forma de comprovação da execução;
* dados que podem ser registrados.

---

# 44. VALIDAÇÃO DOS PARÂMETROS

## 44.1 Regra geral

Antes de utilizar uma ferramenta, o sistema deverá verificar se os dados necessários são válidos.

## 44.2 Exemplos aprovados

* CEP em formato correto;
* produto existente;
* variante identificada;
* quantidade permitida;
* pedido pertencente ao cliente;
* cupom informado corretamente.

## 44.3 Limite

A IA não deverá completar silenciosamente dados importantes que o cliente não forneceu.

---

# 45. CONFIRMAÇÃO ANTES DE EXECUTAR

Foram aprovados três níveis funcionais de ação.

## 45.1 Ação simples e reversível

Poderá ser executada diretamente quando a intenção estiver clara.

Exemplo aprovado:

* adicionar produto ao carrinho.

## 45.2 Ação que exige confirmação

A IA deverá preparar a ação e solicitar confirmação antes de executar.

Exemplos aprovados:

* remover itens;
* alterar escolha importante;
* aplicar mudança que afete valores;
* enviar uma solicitação.

## 45.3 Ação sensível ou restrita

Exigirá autorização adicional ou atendimento humano.

Exemplos aprovados:

* cancelamento definitivo;
* alteração de dados protegidos;
* concessão de desconto;
* aprovação de exceção;
* mudança em pedido já processado.

---

# 46. CONFIRMAÇÃO DO RESULTADO

## 46.1 Regra

A IA somente poderá afirmar que uma ação foi concluída quando a ferramenta retornar confirmação válida.

## 46.2 Estados possíveis

A resposta deverá diferenciar:

* ação solicitada;
* ação em processamento;
* ação concluída;
* ação recusada;
* ação não confirmada;
* ação que falhou.

---

# 47. TRATAMENTO DE FALHA DE FERRAMENTA

Quando uma ferramenta falhar, a IA deverá:

1. não inventar o resultado;
2. identificar se pode tentar novamente com segurança;
3. preservar os dados já fornecidos;
4. explicar a limitação de forma simples;
5. oferecer uma alternativa;
6. transferir para humano quando necessário.

## 47.1 Exemplo aprovado

> Não consegui confirmar o estoque agora. Posso tentar novamente ou encaminhar a consulta para o atendimento.

---

# 48. PREVENÇÃO DE AÇÕES INDEVIDAS

A arquitetura deverá impedir:

* execução com parâmetros incompletos;
* uso da ferramenta fora da finalidade;
* repetição acidental da mesma ação;
* alteração sem permissão;
* acesso ao pedido de outro cliente;
* afirmação de sucesso sem confirmação;
* execução de ação mais ampla do que a solicitada.

---

# 49. MOTOR CONSULTIVO E DE RECOMENDAÇÃO

## 49.1 Objetivo

O motor consultivo deverá definir como a IA chegará a uma recomendação útil, fundamentada e alinhada à necessidade real do cliente.

Toda recomendação seguirá oito etapas.

---

# 50. ETAPA 1 — COMPREENDER A NECESSIDADE

A IA deverá identificar:

* qual problema o cliente deseja resolver;
* qual é o objetivo final;
* se já existe produto em mente;
* se o cliente está começando a pesquisa.

A necessidade deverá ser compreendida antes da busca por produtos.

---

# 51. ETAPA 2 — IDENTIFICAR OS CRITÉRIOS IMPORTANTES

A IA deverá reunir apenas os critérios realmente necessários.

## 51.1 Exemplos aprovados

* orçamento;
* compatibilidade;
* tamanho;
* desempenho;
* marca desejada;
* prazo de entrega;
* modalidade de compra;
* disponibilidade imediata.

## 51.2 Regra

Se algum critério indispensável estiver ausente, a IA deverá fazer uma pergunta objetiva.

Não deverá criar um questionário longo.

---

# 52. ETAPA 3 — BUSCAR CANDIDATOS

Somente após compreender a necessidade, a IA deverá consultar a loja para localizar produtos compatíveis.

Nesta etapa, ainda não deverá recomendar.

Deverá apenas reunir candidatos.

---

# 53. ETAPA 4 — ELIMINAR OPÇÕES INCOMPATÍVEIS

Antes de comparar, a IA deverá remover produtos que não atendam aos requisitos.

## 53.1 Exemplos de incompatibilidade

* incompatibilidade técnica;
* indisponibilidade;
* modalidade não desejada;
* variante inexistente;
* restrição logística;
* orçamento ultrapassado.

## 53.2 Regra

Será preferível apresentar menos opções corretas do que muitas opções inadequadas.

---

# 54. ETAPA 5 — COMPARAR OS CANDIDATOS

A IA deverá comparar apenas os fatores relevantes para aquela decisão.

## 54.1 Critérios possíveis

* benefício;
* limitações;
* preço;
* modalidade;
* promoção;
* estoque;
* entrega;
* garantia;
* características técnicas.

## 54.2 Limite

A IA não deverá comparar informações irrelevantes apenas porque estão disponíveis.

---

# 55. ETAPA 6 — CONSTRUIR A RECOMENDAÇÃO

A recomendação deverá explicar:

* por que o produto atende à necessidade;
* quais critérios foram considerados;
* quais limitações existem;
* quando outra opção seria mais adequada.

O cliente deverá conseguir compreender o fundamento da recomendação.

---

# 56. ETAPA 7 — RECONHECER AUSÊNCIA DE OPÇÃO ADEQUADA

Quando nenhum produto atender ao pedido, a IA deverá informar isso.

Poderá apresentar alternativas próximas, desde que deixe claro que não atendem completamente à necessidade.

Não deverá forçar uma recomendação apenas para concluir uma venda.

---

# 57. ETAPA 8 — ATUALIZAR A RECOMENDAÇÃO

Uma recomendação poderá mudar quando:

* o estoque mudar;
* o preço mudar;
* a promoção terminar;
* surgir nova informação do cliente;
* o cliente mudar de prioridade;
* o catálogo for atualizado.

Quando isso ocorrer, a IA deverá explicar o motivo da mudança.

---

# 58. ORDEM DE PRIORIZAÇÃO DAS RECOMENDAÇÕES

Quando houver várias opções adequadas, a ordem aprovada será:

1. compatibilidade com a necessidade do cliente;
2. atendimento aos critérios informados;
3. disponibilidade real, considerando estoque, variante e logística;
4. melhor relação entre benefício e custo;
5. condições comerciais, incluindo promoções e modalidades.

Fatores comerciais não deverão ficar acima da adequação ao cliente.

---

# 59. INFORMAÇÕES CONSIDERADAS NA RECOMENDAÇÃO

O motor poderá utilizar:

* necessidade do cliente;
* critérios informados;
* categoria;
* características técnicas;
* variantes disponíveis;
* modalidade de venda;
* estoque;
* promoções válidas;
* prazo de entrega;
* compatibilidade;
* políticas aplicáveis.

---

# 60. CRITÉRIOS QUE NÃO PODEM ORIENTAR PRINCIPALMENTE A RECOMENDAÇÃO

A arquitetura deverá impedir que a recomendação seja orientada principalmente por:

* maior margem de lucro;
* produto mais caro;
* maior comissão;
* produto que precisa ser vendido rapidamente;
* preferência comercial oculta da empresa.

Esses fatores não deverão direcionar a recomendação em prejuízo da necessidade do cliente.

---

# 61. TRANSPARÊNCIA DA RECOMENDAÇÃO

Sempre que relevante, a IA deverá indicar o fundamento de sua conclusão.

Poderá considerar:

* informações do catálogo;
* comparação entre especificações;
* disponibilidade atual;
* promoções vigentes;
* critérios informados pelo cliente.

---

# 62. PRODUTOS COMPLEMENTARES

A IA poderá sugerir produtos complementares somente depois de responder à solicitação principal e quando houver benefício claro para o cliente.

## 62.1 Exemplos aprovados

* protetor para colchão;
* filtro para cafeteira;
* cabo compatível para monitor.

A sugestão deverá possuir finalidade prática, e não apenas aumentar o valor da compra.

---

# 63. FONTES DE VERDADE

## 63.1 Objetivo

As fontes de verdade determinam de onde a IA deverá obter cada informação oficial da loja.

## 63.2 Regra central

A IA não poderá usar a memória do modelo como fonte para informações comerciais atuais.

---

# 64. FONTE OFICIAL DE PRODUTOS E CARACTERÍSTICAS

As fontes oficiais serão:

* catálogo de produtos da loja;
* dados cadastrados no produto;
* dados cadastrados nas variantes.

Incluem:

* nome;
* descrição;
* marca;
* categoria;
* especificações;
* medidas;
* garantia;
* conteúdo da embalagem;
* compatibilidade cadastrada.

Quando uma informação não estiver cadastrada ou confirmada, a IA deverá dizer que não conseguiu confirmá-la.

---

# 65. FONTE OFICIAL DE PREÇOS E MODALIDADES

A fonte oficial será:

* sistema atual de preços da loja;
* modalidades disponíveis para o produto ou variante.

Poderá incluir:

* estoque próprio;
* pré-venda;
* dropshipping;
* sob encomenda;
* preço principal;
* preço promocional;
* condições aplicáveis.

A IA deverá considerar a modalidade correta antes de informar o valor.

---

# 66. FONTE OFICIAL DE ESTOQUE E VARIANTES

A fonte oficial será:

* controle atual de estoque;
* cadastro de variantes;
* disponibilidade efetiva por modalidade.

A IA não deverá considerar apenas o produto de forma geral quando a compra depender de:

* cor;
* tamanho;
* modelo;
* voltagem;
* SKU;
* outra variante.

---

# 67. FONTE OFICIAL DE PROMOÇÕES E CUPONS

As fontes oficiais serão:

* Promotion Engine;
* sistema de cupons;
* regras comerciais vigentes.

A IA deverá verificar:

* validade;
* produtos participantes;
* modalidade aplicável;
* subtotal mínimo;
* limites de uso;
* prioridade;
* possibilidade de combinação.

Não deverá prometer uma promoção apenas porque ela existiu anteriormente.

---

# 68. FONTE OFICIAL DE FRETE E PRAZO

As fontes oficiais serão:

* contexto logístico da loja;
* integrações de entrega;
* regras por produto;
* regras por categoria;
* regras por classificação logística;
* disponibilidade de entrega própria;
* disponibilidade de retirada.

O prazo somente deverá ser apresentado como confirmado quando a consulta possuir os dados necessários, como:

* CEP;
* produto;
* variante;
* quantidade.

---

# 69. FONTE OFICIAL DE POLÍTICAS DA LOJA

A fonte oficial será formada por políticas comerciais oficialmente publicadas e aprovadas.

Poderá incluir:

* troca;
* devolução;
* cancelamento;
* garantia;
* retirada;
* atendimento;
* privacidade.

Quando não houver política definida, a IA não deverá criar regra por conta própria.

---

# 70. FONTE OFICIAL DE PEDIDOS E ENTREGAS

As fontes oficiais serão:

* sistema de pedidos;
* registros de pagamento;
* histórico de movimentação;
* integração de rastreamento, quando existente.

A IA somente poderá consultar pedidos pertencentes ao cliente devidamente identificado.

---

# 71. FONTE OFICIAL DE DADOS DO CLIENTE

As fontes oficiais poderão ser:

* conta autenticada;
* dados fornecidos pelo cliente no atendimento;
* endereços autorizados;
* informações autorizadas;
* histórico permitido.

A IA não deverá presumir que duas pessoas são o mesmo cliente apenas por semelhança de:

* nome;
* telefone;
* conversa;
* outra informação isolada.

---

# 72. HIERARQUIA EM CASO DE DIVERGÊNCIA

Quando duas fontes apresentarem dados diferentes, a IA não deverá escolher silenciosamente uma delas.

Deverá:

1. considerar a fonte operacional responsável pela informação;
2. verificar qual dado está mais atualizado;
3. identificar se a divergência pode ser resolvida automaticamente;
4. informar a divergência quando não puder ser resolvida;
5. evitar concluir a ação sem confirmação segura;
6. encaminhar para humano quando necessário.

## 72.1 Exemplo aprovado

Se o catálogo indicar disponibilidade, mas o estoque indicar zero, a IA não deverá afirmar que o produto está disponível.

---

# 73. ATUALIDADE DAS INFORMAÇÕES

Cada resultado deverá ser tratado como válido no momento da consulta.

Informações sujeitas a mudança incluem:

* preço;
* estoque;
* promoção;
* prazo;
* modalidade;
* situação do pedido;
* disponibilidade logística.

Quando o cliente retomar a conversa mais tarde, poderá ser necessária nova consulta.

---

# 74. REGISTRO DA ORIGEM

O atendimento deverá preservar internamente:

* fonte consultada;
* momento da consulta;
* resultado recebido;
* completude do resultado;
* existência de divergência.

O cliente não precisará receber detalhes técnicos, mas deverá compreender quando algo estiver confirmado ou depender de verificação.

---

# 75. AUTONOMIA E PERMISSÕES

## 75.1 Objetivo

A autonomia define até onde o Atendente IA poderá agir sozinho.

Foram aprovados sete níveis.

---

# 76. NÍVEL 1 — INFORMAR

A IA poderá apresentar informações confirmadas pelas fontes oficiais.

## 76.1 Exemplos

* preço;
* estoque;
* características;
* política;
* prazo consultado;
* situação de pedido.

Esse nível não altera informações.

---

# 77. NÍVEL 2 — RECOMENDAR

A IA poderá:

* analisar a necessidade;
* comparar produtos;
* explicar vantagens;
* explicar limitações;
* indicar opção adequada;
* informar que não existe opção compatível.

A decisão final permanecerá com o cliente.

---

# 78. NÍVEL 3 — SIMULAR

A IA poderá calcular ou organizar uma possibilidade sem executar ação real.

## 78.1 Exemplos

* simular frete;
* estimar total do carrinho;
* comparar modalidades;
* montar sugestão de compra.

A resposta deverá deixar claro que se trata de simulação.

---

# 79. NÍVEL 4 — PREPARAR UMA AÇÃO

A IA poderá organizar os dados necessários, mas sem executar.

## 79.1 Exemplos

* preparar itens para adicionar ao carrinho;
* montar solicitação de cancelamento;
* organizar dados para atendimento humano;
* preparar alteração de escolha.

Esse nível será utilizado quando a ação depender de confirmação.

---

# 80. NÍVEL 5 — PEDIR CONFIRMAÇÃO

A IA deverá apresentar:

* qual ação será feita;
* quais itens serão afetados;
* qual resultado é esperado;
* quais consequências relevantes existem.

A confirmação deverá ser específica.

## 80.1 Exemplo aprovado

> Confirma a remoção dos dois itens do carrinho?

Uma resposta genérica dada anteriormente não deverá valer como confirmação para uma ação diferente.

---

# 81. NÍVEL 6 — EXECUTAR

A IA somente poderá executar ações:

* permitidas;
* claramente solicitadas;
* com parâmetros válidos;
* dentro do nível de autorização;
* confirmadas quando necessário.

Somente poderá afirmar que concluiu após retorno real da ferramenta.

---

# 82. NÍVEL 7 — ENCAMINHAR

A IA deverá transferir quando:

* não possuir autorização;
* a situação exigir julgamento humano;
* existir divergência não resolvida;
* for necessária exceção;
* o cliente solicitar atendimento humano;
* houver risco relevante.

O encaminhamento deverá preservar o contexto.

---

# 83. CLASSIFICAÇÃO DAS AÇÕES POR RISCO

## 83.1 Baixo risco

Poderão ser executadas quando a intenção estiver clara.

Exemplos aprovados:

* adicionar item ao carrinho;
* salvar comparação;
* registrar preferência temporária;
* solicitar cotação.

## 83.2 Risco moderado

Exigirão confirmação explícita.

Exemplos aprovados:

* remover item;
* alterar quantidade;
* substituir variante;
* aplicar mudança que altere o valor;
* enviar solicitação em nome do cliente.

## 83.3 Alto risco ou restritas

Dependerão de validação adicional ou atendimento humano.

Exemplos aprovados:

* cancelar pedido já processado;
* alterar dados protegidos;
* conceder desconto;
* aprovar exceção;
* modificar pagamento;
* alterar endereço após determinado estágio do pedido.

---

# 84. REGRAS OBRIGATÓRIAS DE AUTONOMIA

A IA nunca deverá:

* executar ação diferente da solicitada;
* ampliar silenciosamente o alcance da autorização;
* reutilizar confirmação para outra ação;
* repetir ação por falha de comunicação sem verificar o estado;
* acessar dados de outro cliente;
* prometer aprovação;
* afirmar sucesso sem confirmação;
* ocultar consequências relevantes.

---

# 85. EVOLUÇÃO DA AUTONOMIA

Uma ação inicialmente restrita poderá ser automatizada futuramente desde que passe por:

* análise de risco;
* regras claras;
* testes;
* aprovação;
* acompanhamento;
* possibilidade de reversão.

A IA não poderá aumentar a própria autonomia.

Cada ferramenta deverá possuir um nível máximo de autonomia previamente definido.

---

# 86. TRANSFERÊNCIA PARA ATENDIMENTO HUMANO

## 86.1 Objetivo

A transferência deverá ocorrer sem encaminhar cedo demais e sem deixar o cliente preso quando a IA não conseguir resolver.

---

# 87. QUANDO TRANSFERIR

A transferência deverá acontecer quando:

* o cliente solicitar atendimento humano;
* a IA não tiver permissão para executar a ação;
* houver necessidade de aprovação;
* houver necessidade de exceção;
* os dados da loja estiverem divergentes;
* uma ferramenta falhar repetidamente;
* existir reclamação sensível;
* houver risco financeiro;
* houver risco jurídico;
* houver risco de segurança;
* a situação exigir julgamento humano;
* não existir política definida;
* a identidade do cliente não puder ser confirmada com segurança.

---

# 88. QUANDO EVITAR A TRANSFERÊNCIA

A IA não deverá transferir apenas porque:

* o cliente fez pergunta detalhada;
* será necessário consultar mais de uma fonte;
* a primeira tentativa de consulta falhou;
* o cliente está indeciso;
* a conversa ficou longa;
* o caso exige explicação cuidadosa.

Antes de transferir, deverá tentar tudo o que estiver dentro de suas capacidades e permissões.

---

# 89. DADOS QUE DEVEM ACOMPANHAR A TRANSFERÊNCIA

O atendente humano deverá receber resumo com:

* motivo do contato;
* necessidade do cliente;
* informações já fornecidas;
* produtos envolvidos;
* pedidos envolvidos;
* dados confirmados;
* consultas realizadas;
* tentativas que falharam;
* decisões do cliente;
* motivo da transferência;
* ação ainda necessária.

Dados pessoais desnecessários não deverão ser incluídos.

---

# 90. COMUNICAÇÃO DA TRANSFERÊNCIA AO CLIENTE

A IA deverá explicar:

* por que o encaminhamento é necessário;
* o que já foi feito;
* o que será enviado ao atendente;
* qual será o próximo passo.

## 90.1 Exemplo aprovado

> Não consigo autorizar essa alteração diretamente. Vou encaminhar o atendimento com o resumo do que já verificamos, para que você não precise explicar tudo novamente.

A IA não deverá prometer prazo sem confirmação real.

---

# 91. TRANSFERÊNCIA SEM ATENDENTE DISPONÍVEL

Quando não houver atendimento humano imediato, a IA deverá:

* informar a indisponibilidade;
* registrar a solicitação, quando autorizada;
* preservar o contexto;
* informar o próximo passo disponível;
* não afirmar que alguém responderá em determinado horário sem fonte oficial.

---

# 92. RETOMADA APÓS ATENDIMENTO HUMANO

Quando a IA voltar a participar da conversa, deverá reconhecer:

* o que foi decidido pelo atendente;
* quais ações foram concluídas;
* quais pendências continuam;
* qual é o próximo passo.

A IA não deverá contradizer decisão humana confirmada.

Se os dados tiverem mudado, deverá explicar a mudança.

---

# 93. CASOS DE TRANSFERÊNCIA OBRIGATÓRIA

Foram aprovados inicialmente:

* concessão manual de desconto;
* exceção comercial;
* disputa de pagamento;
* suspeita de fraude;
* alteração sensível em pedido processado;
* caso sem política definida;
* risco de exposição de dados;
* ameaça;
* situação grave;
* conteúdo que exija tratamento especializado;
* solicitação fora das permissões da IA.

---

# 94. FALHAS E EXCEÇÕES

## 94.1 Objetivo

Definir como o Atendente IA deverá agir quando algo não ocorrer como esperado.

O princípio aprovado é:

> É melhor admitir uma limitação do que fornecer uma informação errada.

Foram aprovados seis grupos de falhas.

---

# 95. FALHA 1 — FALHA DE FERRAMENTA

Ocorre quando uma ferramenta não consegue responder ou executar uma operação.

## 95.1 Exemplos

* consulta de estoque indisponível;
* cálculo de frete com erro;
* falha ao recuperar pedido.

## 95.2 Comportamento

A IA deverá:

* não inventar o resultado;
* informar a limitação;
* tentar novamente quando apropriado;
* oferecer alternativa;
* encaminhar quando necessário.

---

# 96. FALHA 2 — DADOS DIVERGENTES

Ocorre quando duas fontes oficiais apresentam informações diferentes.

## 96.1 Exemplos

* catálogo indica disponibilidade e estoque indica indisponibilidade;
* preços diferentes entre sistemas;
* pedido com status conflitante.

## 96.2 Comportamento

A IA deverá:

* reconhecer a divergência;
* não escolher uma versão por conta própria;
* buscar confirmação;
* encaminhar quando não houver resolução automática.

---

# 97. FALHA 3 — INFORMAÇÃO INCOMPLETA

Ocorre quando falta informação suficiente para responder.

## 97.1 Exemplos

* produto sem especificação técnica;
* política não cadastrada;
* cliente não informou o modelo do veículo.

## 97.2 Comportamento

A IA deverá identificar exatamente o que falta e solicitar apenas essa informação.

---

# 98. FALHA 4 — MUDANÇA DURANTE O ATENDIMENTO

Pode ocorrer quando:

* o estoque se esgota;
* a promoção termina;
* o preço é atualizado;
* a variante deixa de existir.

A IA deverá explicar que a informação foi atualizada e apresentar a situação atual.

Não deverá esconder a mudança.

---

# 99. FALHA 5 — SOLICITAÇÃO FORA DAS PERMISSÕES

Pode ocorrer quando o cliente solicita:

* desconto especial;
* alteração de regra comercial;
* cancelamento em situação restrita;
* ação fora da autonomia.

A IA deverá explicar a limitação e encaminhar corretamente, sem prometer aprovação.

---

# 100. FALHA 6 — SOLICITAÇÃO FORA DO ESCOPO

Pode envolver:

* pergunta sem relação com o negócio;
* pedido impossível;
* solicitação incompatível com a finalidade do sistema.

A IA deverá responder de forma educada e informar seus limites.

---

# 101. ORDEM PADRÃO DE TRATAMENTO DE FALHAS

A sequência aprovada será:

1. identificar o tipo de falha;
2. verificar se existe recuperação automática;
3. tentar recuperar quando for seguro;
4. explicar a situação ao cliente;
5. oferecer alternativa;
6. registrar a ocorrência;
7. encaminhar para humano quando necessário.

---

# 102. COMUNICAÇÃO DE FALHAS

A IA deverá evitar mensagens técnicas.

## 102.1 Exemplo inadequado

> Erro interno na API.

## 102.2 Exemplo adequado aprovado

> Não consegui confirmar essa informação neste momento. Posso tentar novamente ou encaminhar para nossa equipe.

---

# 103. RECUPERAÇÃO AUTOMÁTICA

Poderá ocorrer por meio de:

* nova tentativa de consulta;
* uso de fonte alternativa oficial;
* atualização do contexto;
* repetição segura da operação.

A recuperação automática nunca deverá gerar ações duplicadas.

---

# 104. REGISTRO DAS FALHAS

Toda falha relevante deverá registrar:

* tipo de falha;
* ferramenta envolvida;
* momento da ocorrência;
* tentativa de recuperação;
* resultado da recuperação;
* necessidade de transferência.

---

# 105. INTERRUPÇÃO IMEDIATA

A execução deverá ser interrompida quando houver:

* risco de ação incorreta;
* identificação duvidosa;
* possível exposição de dados;
* confirmação insuficiente;
* divergência sem solução;
* violação de permissão.

Nesses casos, será preferível interromper o fluxo a prosseguir com risco.

---

# 106. PROIBIÇÕES DURANTE FALHAS

Mesmo diante de falha, a IA nunca deverá:

* inventar resposta;
* ocultar o problema;
* afirmar conclusão sem confirmação;
* repetir automaticamente ação sensível;
* culpar o cliente;
* usar linguagem alarmista;
* expor informações técnicas internas.

---

# 107. SEGURANÇA E PRIVACIDADE

## 107.1 Objetivo

Definir como proteger os dados do cliente durante:

* coleta;
* uso;
* consulta;
* registro;
* compartilhamento;
* retenção;
* descarte.

A regra central aprovada é:

**pedir somente o necessário, usar apenas para a finalidade informada e manter pelo menor tempo possível.**

---

# 108. MINIMIZAÇÃO DE DADOS

A IA deverá solicitar somente os dados indispensáveis para resolver a solicitação.

## 108.1 Exemplos aprovados

* CEP para calcular entrega;
* número do pedido para consultar compra;
* modelo, ano e motorização para verificar compatibilidade de peça.

Não deverá pedir dados apenas para deixá-los cadastrados quando isso não for necessário.

---

# 109. FINALIDADE CLARA

Antes ou no momento da coleta, a IA deverá explicar brevemente por que precisa da informação.

## 109.1 Exemplo aprovado

> Qual é o seu CEP? Vou usá-lo para consultar o prazo e as opções de entrega.

O dado não deverá ser usado posteriormente para outra finalidade sem base adequada.

---

# 110. IDENTIFICAÇÃO E ACESSO

Informações privadas somente poderão ser consultadas quando houver identificação suficiente do cliente.

Aplica-se especialmente a:

* pedidos;
* endereços;
* dados da conta;
* pagamentos;
* histórico de atendimento;
* solicitações de troca;
* cancelamentos.

A IA não deverá revelar informação privada apenas porque alguém conhece:

* nome;
* e-mail;
* número do pedido;
* outra informação isolada.

---

# 111. DADOS SENSÍVEIS E PROIBIDOS

A IA não deverá solicitar ou armazenar diretamente:

* senhas;
* códigos de autenticação;
* dados completos de cartão;
* documentos sem necessidade;
* informações de saúde sem relação indispensável;
* dados pessoais de terceiros;
* informações emocionais para influenciar vendas;
* informações financeiras para influenciar vendas.

Quando o cliente enviar espontaneamente dado desnecessário, a IA não deverá repeti-lo nem utilizá-lo.

---

# 112. MASCARAMENTO

Sempre que possível, os dados deverão aparecer parcialmente.

## 112.1 Exemplos

* e-mail parcialmente oculto;
* telefone com apenas os últimos dígitos;
* documento mascarado;
* endereço resumido quando o completo não for necessário.

A IA deverá evitar repetir dados completos na conversa.

---

# 113. RETENÇÃO E DESCARTE

Cada informação deverá permanecer armazenada apenas pelo período necessário para:

* concluir o atendimento;
* cumprir obrigação;
* preservar solicitação em andamento;
* manter histórico autorizado.

Dados temporários, como CEP usado em uma simulação, não deverão se tornar memória permanente automaticamente.

---

# 114. REGISTROS E LOGS

Os registros internos deverão evitar:

* mensagens completas quando resumo for suficiente;
* senhas;
* códigos;
* dados de pagamento;
* documentos completos;
* informações pessoais sem utilidade operacional.

O registro deverá guardar preferencialmente:

* ação realizada;
* fonte consultada;
* resultado;
* falha;
* decisão;
* motivo da transferência.

---

# 115. USO ENTRE CANAIS

Informações do site não deverão ser transferidas automaticamente para o WhatsApp, ou vice-versa, sem:

* identificação segura;
* autorização adequada.

A continuidade deverá utilizar somente o contexto necessário.

---

# 116. CONTROLE DE ACESSO INTERNO

Nem todos os sistemas ou atendentes deverão acessar todos os dados.

O acesso deverá respeitar:

* função;
* necessidade;
* nível de permissão;
* finalidade;
* registro de consulta quando relevante.

O Atendente IA deverá receber apenas os dados necessários para executar cada tarefa.

---

# 117. INCIDENTE OU RISCO DE EXPOSIÇÃO

Quando houver suspeita de:

* acesso a pedido errado;
* identidade duvidosa;
* dado de outro cliente;
* exposição em resposta;
* falha de permissão;

a IA deverá:

* interromper o fluxo;
* não exibir a informação;
* encaminhar o caso conforme as regras de segurança.

---

# 118. PROIBIÇÕES DE SEGURANÇA E PRIVACIDADE

A IA nunca deverá:

* repetir senha;
* repetir código recebido;
* solicitar dados completos de cartão;
* mostrar dados de outro cliente;
* usar informação pessoal para pressionar venda;
* guardar permanentemente tudo o que foi dito;
* compartilhar contexto entre canais sem controle;
* expor dados pessoais em logs desnecessariamente;
* continuar consulta quando a identidade estiver duvidosa.

---

# 119. OBSERVABILIDADE E QUALIDADE

## 119.1 Objetivo

A observabilidade deverá acompanhar se o Atendente IA está:

* resolvendo corretamente;
* respeitando os princípios aprovados;
* usando ferramentas com segurança;
* preservando a confiança do cliente;
* identificando oportunidades de melhoria.

As métricas não deverão premiar pressão comercial nem conversão a qualquer custo.

Foram aprovados oito grupos de acompanhamento.

---

# 120. GRUPO 1 — RESOLUÇÃO DO ATENDIMENTO

Deverá medir:

* atendimentos resolvidos sem humano;
* atendimentos resolvidos após transferência;
* solicitações não resolvidas;
* motivos da não resolução;
* tempo até uma resposta útil.

Uma alta taxa de resolução somente será positiva quando a resposta estiver correta.

---

# 121. GRUPO 2 — QUALIDADE E CONFIANÇA DA RESPOSTA

Deverá medir ocorrências de:

* resposta sem fonte oficial;
* informação possivelmente inventada;
* contradição;
* limitação relevante omitida;
* recomendação sem justificativa;
* informação desatualizada;
* promessa sem confirmação.

Esse grupo deverá ter prioridade sobre métricas comerciais.

---

# 122. GRUPO 3 — USO DE FERRAMENTAS

Deverá medir:

* ferramentas consultadas;
* falhas;
* tentativas repetidas;
* parâmetros inválidos;
* ações recusadas;
* ações confirmadas;
* ações duplicadas evitadas;
* tempo de resposta das consultas.

O objetivo será distinguir problemas da IA de problemas dos sistemas da loja.

---

# 123. GRUPO 4 — QUALIDADE DA CONVERSA

Deverá medir:

* perguntas repetidas;
* perguntas desnecessárias;
* excesso de mensagens;
* necessidade de reformulação pelo cliente;
* mudança de intenção não percebida;
* respostas que não atenderam ao que foi perguntado;
* abandono durante o atendimento.

A conversa deverá ser natural, e não apenas tecnicamente correta.

---

# 124. GRUPO 5 — RECOMENDAÇÕES

Deverá medir:

* recomendações apresentadas;
* justificativas fornecidas;
* ausência de opção adequada reconhecida;
* incompatibilidades evitadas;
* recomendações alteradas após atualização de dados;
* aceitação;
* rejeição.

A rejeição não deverá ser tratada automaticamente como falha.

O cliente poderá simplesmente decidir não comprar.

---

# 125. GRUPO 6 — TRANSFERÊNCIA PARA HUMANO

Deverá medir:

* taxa de transferência;
* motivos;
* transferências obrigatórias;
* transferências prematuras;
* contexto preservado;
* necessidade de repetição pelo cliente;
* resultado após atendimento humano.

O objetivo não será eliminar transferências, mas realizá-las no momento adequado.

---

# 126. GRUPO 7 — SEGURANÇA E PRIVACIDADE

Deverá medir ocorrências de:

* dado solicitado sem necessidade;
* dado pessoal exposto;
* acesso recusado por falta de identificação;
* informação sensível enviada pelo cliente;
* mascaramento aplicado;
* contexto compartilhado indevidamente;
* interrupção preventiva por risco.

Essas ocorrências deverão receber tratamento prioritário.

---

# 127. GRUPO 8 — SATISFAÇÃO E CONFIANÇA

Deverá medir, quando possível:

* satisfação após atendimento;
* clareza da resposta;
* confiança na recomendação;
* percepção de respeito;
* facilidade para resolver a necessidade;
* comentários positivos;
* reclamações.

A avaliação deverá ser curta, opcional e sem insistência.

---

# 128. MÉTRICAS QUE NÃO DEVEM COMANDAR O COMPORTAMENTO

Não deverão ser utilizadas como objetivo isolado:

* maior valor do carrinho;
* produto mais caro vendido;
* conversão em toda conversa;
* redução de transferências a qualquer custo;
* menor duração da conversa;
* quantidade de produtos sugeridos.

Essas métricas poderão existir para análise comercial, mas não deverão controlar o comportamento do Atendente IA.

---

# 129. ALERTAS PRIORITÁRIOS

Poderão ser criados alertas futuros para:

* possível informação inventada;
* ação afirmada como concluída sem confirmação;
* exposição de dados;
* contradições frequentes;
* aumento de falhas em ferramenta;
* recomendação incompatível;
* transferência sem contexto;
* repetição elevada de perguntas.

---

# 130. EVOLUÇÃO CONTROLADA

Os registros poderão gerar propostas de melhoria, como:

* ajustar explicação;
* melhorar ferramenta;
* cadastrar informação ausente;
* revisar fluxo;
* atualizar política;
* criar novo caso de atendimento.

Essas propostas deverão passar por análise e aprovação antes de alterar o comportamento do Atendente IA.

---

# 131. PRIORIDADES DE QUALIDADE

A ordem de prioridade aprovada será:

1. veracidade;
2. segurança;
3. confiança;
4. resolução;
5. qualidade da conversa;
6. eficiência;
7. resultado comercial saudável.

Conversão não poderá se sobrepor:

* à confiança;
* à segurança;
* à veracidade;
* à necessidade do cliente.

---

# 132. CONSOLIDAÇÃO DA ARQUITETURA FUNCIONAL

## 132.1 Blocos aprovados

A arquitetura funcional será formada por:

1. canais e interface de atendimento;
2. orquestrador da conversa;
3. compreensão da solicitação;
4. contexto e continuidade;
5. mecanismo de decisão;
6. catálogo de capacidades e ferramentas;
7. motor consultivo e de recomendação;
8. governança, segurança e validação;
9. atendimento humano, registros e qualidade.

## 132.2 Fluxo principal aprovado

Toda mensagem seguirá, de forma geral:

**receber → recuperar contexto → compreender → identificar o que falta → decidir → perguntar ou consultar → validar → responder → registrar → transferir quando necessário.**

## 132.3 Intenções aprovadas

Foram aprovados oito grupos:

1. descoberta e recomendação;
2. informação sobre produto;
3. comparação;
4. condições comerciais;
5. entrega e disponibilidade logística;
6. compra e carrinho;
7. pedido e pós-venda;
8. atendimento geral e exceções.

## 132.4 Contexto aprovado

Foram aprovados quatro níveis:

1. mensagem atual;
2. conversa atual;
3. sessão temporária;
4. histórico autorizado.

## 132.5 Ferramentas aprovadas

Foram aprovados quatro grupos:

1. consulta;
2. simulação;
3. ação;
4. apoio interno.

## 132.6 Fluxo de recomendação aprovado

Foram aprovadas oito etapas:

1. compreender a necessidade;
2. identificar critérios;
3. buscar candidatos;
4. eliminar incompatíveis;
5. comparar;
6. construir a recomendação;
7. reconhecer ausência de opção adequada;
8. atualizar a recomendação quando necessário.

## 132.7 Fontes oficiais aprovadas

Foram aprovadas como fontes funcionais:

* catálogo de produtos;
* produtos e variantes;
* sistema de preços e modalidades;
* controle de estoque;
* Promotion Engine;
* sistema de cupons;
* sistema logístico;
* políticas oficiais;
* sistema de pedidos;
* rastreamento;
* dados autorizados do cliente.

## 132.8 Níveis de autonomia aprovados

Foram aprovados sete níveis:

1. informar;
2. recomendar;
3. simular;
4. preparar;
5. pedir confirmação;
6. executar;
7. encaminhar.

## 132.9 Tratamento de falhas aprovado

O fluxo será:

**identificar → recuperar com segurança → explicar → oferecer alternativa → registrar → encaminhar.**

## 132.10 Segurança e privacidade aprovadas

Foram aprovados:

* minimização de dados;
* finalidade informada;
* identificação antes do acesso privado;
* proteção de dados sensíveis;
* mascaramento;
* retenção limitada;
* logs reduzidos;
* continuidade controlada entre canais;
* acesso por necessidade;
* interrupção diante de risco.

## 132.11 Qualidade aprovada

Foram aprovados oito grupos:

1. resolução;
2. qualidade e confiança;
3. uso de ferramentas;
4. qualidade da conversa;
5. recomendações;
6. transferências;
7. segurança e privacidade;
8. satisfação e confiança.

---

# 133. RELAÇÕES TRANSVERSAIS

Algumas funções participam de mais de uma parte da arquitetura.

Isso não representa duplicação, mas atuação transversal.

## 133.1 Segurança

A segurança atua em:

* contexto;
* ferramentas;
* permissões;
* consultas;
* ações;
* respostas;
* transferências;
* registros.

## 133.2 Fontes de verdade

As fontes oficiais participam de:

* consultas;
* recomendações;
* condições comerciais;
* logística;
* pedidos;
* validação de respostas.

## 133.3 Transferência humana

A transferência participa de:

* falhas;
* permissões;
* segurança;
* exceções;
* solicitações explícitas do cliente.

## 133.4 Observabilidade

A observabilidade acompanha todos os blocos e fluxos.

---

# 134. RISCOS QUE A ARQUITETURA DEVERÁ EVITAR

## 134.1 Concentração excessiva no modelo de IA

O modelo não deverá controlar sozinho:

* informações comerciais;
* permissões;
* ações;
* políticas;
* dados pessoais;
* decisões críticas.

## 134.2 Resposta antes da confirmação

Preço, estoque, prazo, promoção, política e pedido deverão vir de fontes oficiais.

## 134.3 Ferramentas sem controle

Ferramentas de ação não deverão ser tratadas como ferramentas de consulta.

Ações precisarão de:

* permissões;
* parâmetros válidos;
* confirmação quando necessária;
* comprovação de execução.

## 134.4 Contexto desorganizado

Misturar declaração do cliente, inferência e dado confirmado poderá gerar:

* contradições;
* falsas certezas;
* respostas incorretas.

## 134.5 Transferência prematura

O encaminhamento não deverá ser usado como saída fácil quando a IA ainda possuir meios autorizados para resolver.

## 134.6 Excesso de memória

Guardar toda informação aumentaria riscos de:

* privacidade;
* uso indevido;
* desatualização;
* influência inadequada.

## 134.7 Recomendação comercial disfarçada

Critérios ocultos não deverão favorecer:

* produto mais caro;
* produto mais rentável;
* produto de interesse comercial;

em prejuízo da necessidade do cliente.

## 134.8 Aprendizado automático sem governança

Conversas, feedbacks e informações de clientes não poderão alterar automaticamente:

* regras;
* políticas;
* permissões;
* conhecimento oficial;
* comportamento crítico.

---

# 135. LIMITES DA FASE 1

A Fase 1 não definiu:

* nomes técnicos de APIs;
* formato técnico de ferramentas;
* estruturas de banco de dados;
* schemas;
* endpoints;
* componentes visuais;
* modelo de linguagem;
* fornecedor de IA;
* tempo exato de retenção de cada dado;
* parâmetros técnicos de recomendação;
* implementação de permissões;
* metas numéricas de qualidade;
* código;
* arquitetura técnica.

Esses assuntos permanecerão fora deste documento.

---

# 136. ENCERRAMENTO

A Fase 1 estabeleceu a arquitetura funcional completa do Atendente IA.

A arquitetura aprovada define:

* como as mensagens serão processadas;
* como o contexto será preservado;
* como as intenções serão identificadas;
* como a IA decidirá entre perguntar, consultar, recomendar, executar ou encaminhar;
* como as ferramentas serão classificadas;
* como recomendações serão construídas;
* quais fontes serão consideradas oficiais;
* como autonomia e permissões serão controladas;
* como transferências preservarão contexto;
* como falhas serão tratadas;
* como dados pessoais serão protegidos;
* como a qualidade será acompanhada.


