# Métricas, observabilidade e retenção

Períodos disponíveis: hoje, 7, 30, 90 dias e intervalo personalizado, sempre em `America/Sao_Paulo`. Toda métrica informa fonte, quantidade de registros e estado real, parcial ou indisponível. Ausência de dados não é apresentada como zero estimado.

Logs e projeções removem sessão, cookies, contatos completos, CPF, CEP, cartões, pedidos, endereços, chaves PIX, tokens, prompts, payloads e argumentos sensíveis.

Retenção:

- permanente: versões publicadas, publicações, restaurações, auditorias, hashes e identidades;
- 24 meses: avaliações, revisões, propostas e evidências;
- 12 meses: execuções e resultados do laboratório;
- 90 dias: dados técnicos temporários não protegidos.

Somente dry-run está implementado. Ele é restrito ao Gestor, auditado e exclui zero registros. Não existe rotina de exclusão física.
