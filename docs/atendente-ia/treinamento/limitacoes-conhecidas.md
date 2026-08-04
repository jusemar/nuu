# Limitações conhecidas

- Regressões assíncronas dependem de retomada administrativa explícita; não há fila ou worker externo.
- Não existe exclusão física de retenção, apenas relatório e dry-run auditado.
- Não há exportação administrativa na primeira versão.
- Métricas sem evento persistido confiável ficam indisponíveis; não são inferidas.
- Percentis usam no máximo 10.000 durações por consulta e ficam marcados como parciais acima desse volume.
- O painel não expõe conversas completas, prompts, raciocínio ou argumentos brutos; isso limita investigações exclusivamente pela interface.
- A feature flag deve ser alterada por implantação. Não há rollout percentual no painel.
- Não existe integração externa adicional de observabilidade neste módulo.
