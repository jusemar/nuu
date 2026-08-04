# Checklist de rollback seguro

1. Definir `ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS=false` no ambiente afetado.
2. Reimplantar ou reiniciar o runtime para recarregar a variável.
3. Confirmar fallback do comportamento e base legada do RAG.
4. Validar `/atendimento`, resposta estruturada, ferramentas e transferência.
5. Não apagar publicações, fragmentos, versões ou auditorias.
6. Registrar horário, motivo, sintomas e identidade das publicações envolvidas.
7. Investigar em ambiente isolado e somente então preparar nova versão editorial.

Rollback da flag não exige rollback de migration nem restauração destrutiva de banco.
