# Papéis e permissões

O acesso continua ancorado em `ADMIN_EMAILS`. No primeiro acesso autorizado, o bootstrap idempotente cria o Gestor principal e registra auditoria.

- Gestor principal: leitura, escrita editorial, publicação, restauração, gestão de papéis e dry-run de retenção.
- Revisor: conhecimentos, avaliações, propostas, revisão e testes; não publica, restaura, gerencia papéis ou executa retenção crítica.
- Visualizador: leitura de conhecimentos e métricas. Conversas sanitizadas exigem capacidade adicional explícita.

Papéis revogados não são reativados pelo bootstrap. Capacidades, ator, autoria e regra de autoaprovação são recalculados no servidor. O autor só pode autoaprovar quando não existe outro Gestor ou Revisor ativo elegível.
