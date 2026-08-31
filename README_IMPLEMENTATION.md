# Studio — Social Media OS implementation

## Implementado nesta evolução

- Command Center com oportunidades, inbox, leads, concorrência e automações.
- Radar oficial com avaliação estratégica por IA e trilha de auditoria.
- Planejamento de campanhas distribuído, timezone `America/Sao_Paulo`, preferências editoriais, transação e idempotência concorrente por usuário.
- Versionamento editorial com SHA-256 de texto + conjunto ordenado de mídias.
- Aprovação vinculada à versão atual e invalidação automática após alteração material.
- Triggers de banco impedindo alteração silenciosa, mídia mutável após aprovação e status aprovado/agendado sem binding válido.
- Solicitação de publicação do Instagram com payload integral congelado e hash completo.
- Teste não público e confirmação humana obrigatória antes de publicação externa.
- Polling do Instagram limitado para não segurar requisições por minutos.
- Limpeza explícita do Heartbeat após execução agendada, com auditoria de falhas de cleanup.
- Autopilot seguro com níveis Manual, Assistido, Semiautomático e Autopilot.
- Autopilot capaz de criar rascunhos a partir de oportunidades e leads internos seguros, sem envio externo automático.
- Brand Guardian multimodal avaliando imagem única ou carrossel completo, incluindo qualidade, aderência de marca, legibilidade, consistência, risco de aparência de IA e risco de publicidade jurídica.
- Video Studio, SEO/Local, Ads Intelligence, Relatórios IA, memória estratégica, agentes e compliance.
- Auditoria SEO baseada em leitura real da página com proteção contra SSRF.
- Upload de conhecimento endurecido: DOCX validado pela estrutura real do diretório central ZIP; ZIP genérico é rejeitado.
- CI definido para typecheck, testes, build e validação de migrations.
- Smoke test e readiness endurecidos para não aceitar HTML genérico como API saudável.
- Journal de migrations reconciliado, migrations órfãs removidas e validador configurado para falhar se surgirem SQLs fora do journal.

## Restrições deliberadas

- Conteúdo jurídico continua exigindo aprovação humana.
- Publicação externa continua exigindo confirmação explícita.
- Autopilot não movimenta orçamento nem publica anúncios automaticamente.
- Facebook, LinkedIn, TikTok, YouTube, Google Business Profile e plataformas de Ads dependem de aplicativos, credenciais e permissões oficiais antes de conectores de produção serem habilitados.

## Validação

O workflow `.github/workflows/ci.yml` está configurado, porém o GitHub Actions do repositório está encerrando os runs com `startup_failure` antes de criar qualquer job. O endpoint de jobs do run atual retorna zero jobs; portanto `pnpm check`, `pnpm test` e `pnpm build` ainda não foram executados pelo GitHub nesta branch.

Antes do merge final devem existir evidências de:

1. `pnpm check` concluído com sucesso;
2. `pnpm test` concluído com sucesso;
3. `pnpm build` concluído com sucesso;
4. `node scripts/validate-migrations.mjs` concluído com sucesso;
5. migrations aplicadas em banco de staging/produção sem reset;
6. `/api/health` e `/api/ready` retornando JSON esperado;
7. smoke das rotas principais;
8. OAuth/teste não público do Instagram validado com credenciais oficiais quando disponíveis.

O PR deve permanecer em draft até que um runner execute a suíte ou uma validação equivalente seja realizada em ambiente de build autorizado. Não há autorização implícita neste documento para publicar conteúdo, ativar anúncios, movimentar orçamento ou realizar deploy em produção.

### Bloqueio atual

No run mais recente inspecionado, o GitHub registrou `conclusion=startup_failure` e `total_count=0` em jobs. Isso significa que a falha ocorreu antes de qualquer etapa do workflow (`install`, `typecheck`, `test`, `build` ou validação de migrations).
