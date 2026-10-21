# Reconciliação operacional Laquila

O job `/api/jobs/reconciliar-pedidos-laquila` consulta **somente 00008**. Não
importa nem executa criação de pedido, cancelamento remoto, estoque ou gateways.
As páginas administrativas e do cliente apenas leem o estado persistido.

## Execução

- Agenda Vercel: uma vez por hora, minuto 17, em produção.
- Autorização obrigatória: `Authorization: Bearer <CRON_SECRET>`; sem segredo ou
  com credencial inválida, responde 401 antes de consultar banco/fornecedor.
- `CRON_SECRET` deve existir como variável secreta em Production. Nunca deve
  aparecer em Git, logs, URLs ou respostas. O agendador Vercel envia o header.
- A agenda horária exige plano Vercel que permita mais de uma execução diária.
  Não há upgrade automático de plano nem scheduler externo criado por este código.
- Lote máximo: cinco integrações, serialmente, timeout isolado de 15 segundos por
  chamada. A próxima execução prioriza as integrações mais antigas/vencidas.
- Cada integração tem intervalo mínimo de uma hora. Falhas repetidas aumentam o
  intervalo para duas, quatro e até seis horas. Não há retry HTTP imediato.
- Concessão atômica de três minutos no PostgreSQL impede consultas concorrentes.
  O dono antigo não pode persistir depois que outra execução adquiriu a concessão.
  Se um processo morrer, o registro volta a ser elegível ao vencer a concessão.

## Elegibilidade e persistência

Somente integrações `laquila`, no ambiente da aplicação, da configuração ativa,
com criação técnica `criado`, ID externo e pedido interno ainda em atendimento.
Pedidos pendentes sem integração, como #1012, não entram na seleção.
Pedidos internos cancelados, reembolsados, expirados ou entregues ficam fora.

O JSON existente `fornecedor_pedido_integracoes.payload_sanitizado` recebe
`reconciliacao00008`, sem migration. Contém estado externo, campos operacionais
permitidos, última consulta, última mudança, próxima consulta, falhas e eventual
revisão operacional. `concessaoReconciliacao00008` é temporário e removido ao
final. O payload histórico de criação, hash, ID externo, tentativas e chave de
idempotência permanecem preservados.

O status técnico da criação continua `criado`: ele não é o estado comercial do
fornecedor e jamais é convertido para `falha` por um cancelamento externo.
Isso mantém a proteção existente contra qualquer novo 00002.

## Contrato observado

Em 20/10/2026, o pedido 1133591 retornou HTTP 400 com:

```json
{ "erro": "O pedido 1133591 está cancelado." }
```

Somente HTTP 400 e essa frase exata, normalizada para acentos/maiúsculas e com o
mesmo ID consultado, comprovam cancelamento nesta implementação. Mensagem de
outro pedido, texto negado, HTTP 401/403/5xx e resposta desconhecida não cancelam.
Outros códigos finais precisam de contrato/documentação antes de serem mapeados.

O cancelamento confirmado é terminal e sai da fila. Campos de estágio/situação
retornados para o pedido correto são guardados por lista permitida; não se deduz
o significado de `RECUSA TEMPORÁRIA`, `Bloqueado` ou códigos novos.
Em falha, o último estado confiável permanece intacto.

## Projeção no pedido

Integração, pedido e histórico são atualizados em uma transação curta, depois da
chamada HTTP. O pedido inteiro só recebe `canceled` quando o snapshot v2 comprova
que todos os seus itens pertencem a grupos Laquila cancelados, com quantidades
correspondentes, sem envio/entrega registrado. Carrinho misto, snapshot incompleto
ou pedido já enviado exigem revisão administrativa; não cancelam itens alheios.

A mudança gera um único histórico comercial, sem termos técnicos, e o cliente vê
"Pedido cancelado". O Admin vê também o estado externo e o diagnóstico seguro.
Nenhum pagamento é alterado, estornado ou reembolsado. Não há reposição de estoque
externo nem alteração automática de pontos/recursos financeiros nesta etapa.

## Validação e operação

Os testes puros usam dependências em memória e nunca chamam APIs reais. A
validação de produção usa o mesmo job protegido; não atualiza status via SQL.
Invocações concorrentes/repetidas não duplicam histórico e não chamam 00002.
O endpoint retorna apenas contagens, sem IDs pessoais nem dados de autenticação.
