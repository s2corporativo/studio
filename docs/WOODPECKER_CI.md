# Woodpecker CI — Studio

O Studio usa `.woodpecker.yaml` como pipeline de validação independente do GitHub Actions.

## Eventos

- push
- pull_request
- manual

## Gate executado

1. `pnpm install --frozen-lockfile`
2. `pnpm check`
3. `pnpm test`
4. `pnpm build`
5. `node scripts/validate-migrations.mjs`

Qualquer comando com exit code diferente de zero encerra o workflow com falha.

## Ativação na instância Woodpecker existente

1. Sincronizar os repositórios do forge e habilitar `s2corporativo/studio`.
2. Manter o caminho de configuração vazio/padrão ou definir explicitamente `.woodpecker.yaml`.
3. Habilitar eventos de Pull Request no projeto.
4. Não adicionar secrets ao pipeline de validação. O gate deve permanecer sem acesso a credenciais Meta, banco de produção ou chaves de deploy.
5. Executar primeiro uma pipeline manual e confirmar que `check`, `test`, `build` e migrations terminam com sucesso.
6. Somente depois usar o status do Woodpecker como evidência de liberação dos PRs.

## Segurança

Este workflow valida código. Ele não executa deploy, migrations em banco real, OAuth, publicação em redes sociais ou alterações de orçamento.
