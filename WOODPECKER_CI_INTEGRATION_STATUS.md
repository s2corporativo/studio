# Integração Woodpecker CI — Status Controlado

**Data:** 29/08/2026  
**Repositório:** `s2corporativo/studio`  
**Pull request:** [#10](https://github.com/s2corporativo/studio/pull/10)  
**Branch de CI:** `ci/woodpecker-studio`  
**Commit corretivo:** `49a231ecb2341a045b6c73f723e920f4b6a7f7ef`

## Resultado direto

O Studio foi integrado ao Woodpecker existente na VPS compartilhada, o repositório foi habilitado e o pipeline do PR #10 foi disparado e aprovado. A correção de CI foi validada localmente; o pipeline remoto corrigido está **na posição 2 da fila normal**, aguardando dois workflows de outro repositório. Nenhuma implantação, migration, alteração de banco, restart, cancelamento ou modificação de concorrência foi realizada.

## Configuração aplicada

O pipeline `.woodpecker.yml` usa a imagem `node:22-bookworm` e executa apenas:

1. `pnpm install --frozen-lockfile`;
2. `pnpm check`;
3. `pnpm test`;
4. `pnpm build`;
5. `node scripts/validate-migrations.mjs`.

O bootstrap foi ajustado com `corepack@0.31.0` fixado antes da ativação do `pnpm@10.4.1`. Isso corrige a incompatibilidade de assinatura encontrada no Corepack embarcado na imagem Node 22, sem usar secrets de produção. Os testes OAuth e de validação Meta receberam valores fictícios exclusivamente em mocks unitários, mantendo o bloqueio real quando as credenciais de produção não forem validadas.

| Verificação local da branch | Resultado |
|---|---|
| Instalação congelada | Aprovada |
| TypeScript (`pnpm check`) | Aprovado |
| Testes | 71 aprovados, 1 integração Meta externa intencionalmente ignorada |
| Build | Aprovado |
| Validação de migrations | 20 migrations válidas, sem SQL órfão |
| `git diff --check` | Aprovado |

## Execuções Woodpecker

| Pipeline | SHA | Situação | Registro |
|---|---|---|---|
| #1 manual | `7e53873373` | Falhou | Corepack incompatível e mocks de testes dependentes do ambiente; causa corrigida no commit `49a231e` |
| #2 do PR #10 | `49a231ecb2` | Aprovado | `clone` em 00:04 e `validate` em 02:38; código de saída 0 |

O pipeline de pull request exige aprovação de mantenedor, política que foi preservada. O pipeline #2 foi aprovado individualmente conforme a autorização recebida; nenhuma política global de aprovação foi alterada.

## Proteção da VPS compartilhada

A VPS possui 6 vCPUs e 11 GiB de memória. Durante a validação, a carga média ficou acima de 6 e o workflow em execução consumiu aproximadamente 1,64 GiB e mais de 100% de CPU. O agente foi mantido em **um workflow paralelo**, a escolha segura para não comprometer os serviços existentes.

> A fila deve permanecer com sua ordem natural. Não é aceitável aumentar a concorrência, cancelar ou reiniciar jobs de outros sistemas apenas para acelerar a CI do Studio.

## Próximo passo

O pipeline #2 concluiu com sucesso após a liberação natural da fila única. O PR #10 está apto para revisão humana e integração controlada, desde que o diff permaneça o mesmo commit validado e não sejam incluídos deploys, migrations adicionais ou secrets.
