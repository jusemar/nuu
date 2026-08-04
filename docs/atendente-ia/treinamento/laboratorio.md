# Laboratório

Testes individuais ou pequenos são síncronos; regressões maiores são persistidas como assíncronas. A execução assíncrona atual progride por retomada administrativa explícita, sem worker ou fila externa.

Garantias:

- dados fictícios por padrão;
- snapshots somente após anonimização irreversível e autorização;
- nenhum efeito real, WhatsApp, pedido ou ferramenta de escrita;
- configuração e hashes congelados;
- comparação publicada versus candidata;
- custo, tokens, duração, resultados e violações persistidos;
- cancelamento e retomada idempotentes.

Limitação: sem fila externa, regressões não continuam sozinhas após a requisição. Risco: permanecerem em processamento até intervenção. Recomendação futura: worker durável com lease, heartbeat e retries, sem alterar os contratos atuais.
