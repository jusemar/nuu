# Checklist de ativação

1. Manter `ATENDENTE_IA_PUBLICACOES_ADMIN_ATIVAS=false` em produção.
2. Fazer backup e confirmar migrations 0007–0014 na implantação alvo.
3. Validar as migrations em clone descartável compatível.
4. Confirmar Gestor principal, revisores e capacidades.
5. Publicar conhecimento e comportamento aprovados em homologação.
6. Executar laboratório e regressões obrigatórias.
7. Testar flag `true` em homologação: sem publicação, com publicação e fallback.
8. Validar `/`, `/atendimento` e as cinco rotas administrativas.
9. Revisar métricas, RAG, ferramentas dinâmicas, handoff e privacidade.
10. Registrar janela, responsáveis e plano de rollback.
11. Alterar a variável somente no ambiente aprovado e reimplantar.
12. Monitorar falhas, fallback, fontes, latência, tokens e custo.

Nenhum arquivo `.env` real deve ser editado silenciosamente. A ativação real é uma operação futura e deliberada.
