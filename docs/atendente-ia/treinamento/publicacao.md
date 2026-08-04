# Publicação

Somente Gestor principal publica. Elegibilidade, revisão, hash, casos obrigatórios, laboratório, bloqueios e alertas são recalculados no servidor dentro do fluxo protegido.

Publicações individuais e em lote usam transação, advisory locks, chave idempotente e hash da requisição. Fragmentos novos ficam inativos até a troca; falhas preservam integralmente a versão anterior. Lotes são tudo-ou-nada. A publicação registra identidade, itens ordenados, autoria, horário e auditoria.

Falhas críticas de segurança, privacidade, fonte, consulta real obrigatória, ferramenta protegida ou regressão bloqueiam. Alertas não críticos exigem justificativa. O consumo público exige publicação com status `concluida`.
