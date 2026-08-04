# Restauração

Restauração nunca substitui diretamente a versão publicada. Ela cria um novo rascunho a partir de uma versão histórica, usando validação, núcleo de segurança e hash atuais.

O fluxo exige capacidade de restauração, justificativa, chave idempotente, locks por chave e recurso, validação de origem e auditoria. Repetição com o mesmo payload é idempotente; payload divergente é rejeitado. O rascunho restaurado precisa passar novamente por revisão, laboratório, elegibilidade e publicação.
