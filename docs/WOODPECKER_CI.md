# Woodpecker CI — Studio

O Studio usa `.woodpecker.yml` como pipeline de validação independente do GitHub Actions, alinhado ao padrão já utilizado pelo EJC na mesma infraestrutura Woodpecker self-hosted.

## Eventos

- `push` apenas na branch `main`;
- `pull_request`;
- `manual`.

## Gate executado

1. `corepack enable`
2. `corepack prepare pnpm@10.4.1 --activate`
3. `pnpm install --frozen-lockfile`
4. `pnpm check`
5. `pnpm test`
6. `pnpm build`
7. `node scripts/validate-migrations.mjs`

Qualquer comando com exit code diferente de zero encerra o pipeline com falha.

## Ativação na instância Woodpecker existente

1. Sincronizar os repositórios do forge e habilitar `s2corporativo/studio`.
2. Manter o caminho de configuração vazio/padrão ou definir explicitamente `.woodpecker.yml`.
3. Habilitar eventos de Pull Request no projeto.
4. Não adicionar secrets ao pipeline de validação. O gate deve permanecer sem acesso a credenciais Meta, banco de produção ou chaves de deploy.
5. Executar primeiro uma pipeline manual e confirmar que `check`, `test`, `build` e validação de migrations terminam com sucesso.
6. Somente depois usar o status do Woodpecker como evidência de liberação dos PRs.

## Segurança

Este workflow valida código. Ele não executa deploy, migrations em banco real, OAuth, publicação em redes sociais ou alterações de orçamento.

## Relação com o release gate

Quando o PR do `release:gate` for integrado, o gate local continuará como segunda barreira de segurança. O Woodpecker será a validação remota do PR/branch e o `release:gate` permanecerá responsável por impedir que os caminhos oficiais de release avancem sem a mesma classe de verificações.
