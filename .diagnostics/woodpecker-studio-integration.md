# Diagnóstico seguro — Woodpecker CI do Studio

**Data:** 29/08/2026  
**VPS:** inventariada sem alterações de serviços, banco, redes, volumes, firewall ou deploy.

## Evidências confirmadas

- O acesso SSH exclusivo desta missão foi autorizado; nenhuma chave privada foi exibida ou versionada.
- Woodpecker Server e Agent `v3.18.0` estão em execução há aproximadamente três dias, na rede `woodpecker_default`.
- A integração GitHub existente está configurada; seus valores foram mantidos ocultos.
- `s2corporativo/studio` foi sincronizado e habilitado exclusivamente no Woodpecker, como repositório interno `5`.
- O pipeline manual `#1` foi criado para `ci/woodpecker-studio`, no SHA `7e5387337358e9c0d9ba7f4d3d7b388da3c06fe9`, sem variáveis adicionais, deploy ou migration.
- A configuração da branch executa Node 22, `pnpm@10.4.1`, instalação congelada, check, testes, build e validador local de migrations. O validador não acessa banco ou secret externo.

## Estado da fila

O agente está configurado para apenas um workflow paralelo. Um workflow existente de outro repositório ocupava a fila e continuava em seu build/seed normal, de modo que o pipeline do Studio permanecia em `not started yet`. Nenhum workflow de terceiro foi interrompido, reiniciado ou reconfigurado. A prioridade mantida é produção antes de CI.

Às 17:27 (GMT-3), a API somente leitura da fila confirmou que o pipeline `#1` do Studio passou para execução no agente `1`. Permaneciam na fila quatro workflows de outros repositórios (`verdelimpclaude` e `s2licit`), todos sem agente atribuído. O pipeline do Studio não foi priorizado artificialmente nem concorreu em paralelo; ele iniciou quando o único agente ficou disponível.

## Próxima verificação segura

Confirmar o status da fila/agent pela API ou interface do Woodpecker e iniciar a coleta dos logs do Studio somente após o agente aceitar a execução.

## Correção e reteste

O primeiro pipeline manual falhou antes do build porque a imagem Node 22 trazia uma versão de Corepack incapaz de validar a assinatura do `pnpm@10.4.1`; depois, testes unitários ainda liam a configuração Meta do ambiente. A branch recebeu o commit `49a231ecb2341a045b6c73f723e920f4b6a7f7ef`, que instala `corepack@0.31.0` de forma fixa antes de ativar o pnpm e usa credenciais fictícias somente nos mocks unitários. A sequência integral foi aprovada na cópia isolada: check, 71 testes, build e validação de 20 migrations. O push criou automaticamente o pipeline do PR `#10` no Woodpecker, como pipeline `#2`, para o SHA corrigido; ele aguardava a fila única no momento deste registro.

O pipeline `#2` não entrou na fila geral porque a política existente exige aprovação de mantenedor para pipelines de pull request. Esse é um controle de segurança configurado no Woodpecker; a execução será autorizada somente para o PR #10, conforme a instrução expressa da missão, sem alterar essa política global.

Após a aprovação explícita do pipeline `#2`, a API de fila confirmou sua entrada na posição 6. Os cinco itens anteriores pertencem a outros repositórios e o workflow em execução continua sendo `verdelimpclaude #98`. A ordem e o limite de um workflow paralelo foram preservados; não houve priorização, cancelamento ou alteração de concorrência.

## Capacidade e decisão operacional

Na verificação de 29/08/2026, a VPS tinha 6 vCPUs, 11 GiB de memória total e 6,7 GiB disponíveis. O job ativo consumia cerca de 1,64 GiB e 103% de CPU; a carga média superava 6. Por isso, não é seguro elevar a concorrência do agente neste momento. O pipeline do Studio permanecerá na fila normal até que o agente fique disponível, preservando a estabilidade dos sistemas compartilhados.

Após o workflow inicial de `verdelimpclaude` concluir, o agente iniciou o pipeline `#84` de `s2licit`. A execução corrigida do Studio permanece preservada na posição 3, atrás de dois workflows de `verdelimpclaude`. A API do Woodpecker confirma que o pipeline `#2` ainda está pendente, sem erro adicional ou descarte.

Na última consulta, o único agente ativo `vps-prod-01` informa capacidade `1` e o pipeline do Studio estava na posição 2, atrás de `verdelimpclaude #99`. A ausência de logs do Studio é esperada enquanto o passo raiz `woodpecker` está pendente; não é uma falha da configuração corrigida.

## Conclusão da execução remota

Em 30/08/2026, o pipeline `#2` iniciou após a liberação natural do agente único e terminou com código de saída `0`. As etapas `clone` (00:04) e `validate` (02:38) foram aprovadas. O workflow não executou migrations, deploys, alterações de banco nem mudanças de configuração de produção.
