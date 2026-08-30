# Diagnóstico de produção — 29/08/2026

- `GET /api/ready` no domínio publicado respondeu HTTP 200, `application/json`, com `status: "ready"`, serviço `depaula-social-os` e todos os checks internos verdadeiros.
- `GET /api/health` respondeu HTTP 200 no smoke test.
- O primeiro smoke test executado durante a propagação marcou readiness como falha, pois não recebeu o corpo esperado; a consulta subsequente confirmou o contrato JSON correto.
- No navegador sandbox, a URL raiz do domínio publicado concluiu o carregamento de recursos estáticos, mas deixou o elemento `#root` sem filhos visíveis. Não houve erro registrado no console nessa inspeção.
- No ambiente de desenvolvimento, a mesma rota montou o dashboard e seu skeleton de carregamento dentro de `#root`, confirmando que a diferença é específica do bundle ou da entrega de produção, e não da árvore de componentes em desenvolvimento.
- A próxima investigação deve comparar a montagem do cliente em produção e em desenvolvimento, além de validar respostas dos bundles estáticos e possíveis exceções capturadas antes de marcar a publicação como concluída.
