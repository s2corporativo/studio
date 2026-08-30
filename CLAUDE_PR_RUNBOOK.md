# Roteiro de Pull Request para Claude — S2 Studio

## Instrução pronta para copiar e enviar

> Trabalhe no repositório privado `s2corporativo/studio` a partir da branch `main` atual. Crie uma branch nova no padrão `feat/<tema-curto>` ou `fix/<tema-curto>`; não faça push direto para `main`. Mantenha o escopo estritamente limitado ao pedido, preservando o Social Media OS, os bloqueios de publicação, a revisão humana obrigatória e a identidade visual institucional.
>
> Você não tem autorização para solicitar, visualizar, registrar, imprimir, versionar ou modificar secrets, tokens, senhas, URLs de banco, `.env`, App Secret da Meta, chaves OAuth, `DATABASE_URL` ou credenciais de produção. Não faça deploy, não execute migrations contra banco remoto, não altere serviços na VPS e não publique conteúdo em redes sociais.
>
> Antes do PR, rode `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test`, `pnpm build`, `pnpm audit --prod --audit-level high` e `pnpm deploy:preflight`. Corrija todas as falhas que forem introduzidas pela sua alteração. Não desabilite testes, guards de governança, rate limits, validações Meta, confirmações humanas ou controles de acesso para fazer a suíte passar.
>
> Se a alteração exigir banco, edite primeiro o schema Drizzle, gere uma migration incremental nova e aditiva, confira o SQL gerado e inclua-a no PR. Não modifique migrations já aplicadas. A aplicação da migration no TiDB será feita separadamente, após revisão humana, antes de publicar o código dependente do novo schema.
>
> Abra um Pull Request para `main` com descrição objetiva: objetivo, arquivos alterados, impacto no banco, migrations novas, testes executados, resultado de cada comando, riscos, rollback e itens deliberadamente não alterados. Mantenha o PR como rascunho se houver pendência de validação. Não faça merge.

## Critérios operacionais

| Item | Regra obrigatória |
|---|---|
| Branch | Criar a partir de `main` atual e usar `feat/` ou `fix/` |
| Commits | Pequenos, descritivos e restritos ao escopo |
| Interface | Preservar verde profundo, bronze, marfim, logomarca oficial e contraste nos dois temas |
| Redes sociais | Manter OAuth bloqueado até credencial validada, teste não público e confirmação humana |
| Banco | Gerar migration incremental; nunca aplicar contra produção nem reescrever migration histórica |
| CI | Rodar a sequência local completa; o Woodpecker repete a validação sem secrets de produção |
| Pull request | Explicar impacto, testes, schema, risco e rollback; não realizar merge |

## Estado de schema conhecido

A última migration aplicada é `0020_automation_allow_self_approval.sql`. Ela criou a coluna `automation_settings.allowSelfApproval` como `tinyint(1) NOT NULL DEFAULT 1`. A aplicação foi confirmada no TiDB em 30/08/2026. Qualquer mudança posterior de schema deve produzir uma migration com número seguinte, sem alterar a `0020`.

## Modelo de descrição de PR

```md
## Objetivo

<descreva em uma frase o problema ou melhoria>

## Alterações

- <arquivo / comportamento alterado>
- <arquivo / comportamento alterado>

## Banco e migrations

- [ ] Não há mudança de schema.
- [ ] Há migration nova: `<arquivo>`. Ela é aditiva e ainda não foi aplicada em produção.

## Validações executadas

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm check`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm audit --prod --audit-level high`
- [ ] `pnpm deploy:preflight`

## Riscos e rollback

<descreva o risco real e como reverter apenas o código, sem apagar dados>

## Não alterado deliberadamente

- Secrets e variáveis de ambiente.
- Banco de produção e migrations aplicadas.
- Deploy, VPS e configurações de Woodpecker.
- OAuth, publicação e agendamento externo sem aprovação humana.
```

## Publicação após aprovação humana

Após a revisão do PR e merge na `main`, a integração controlada deve seguir esta ordem: conferir o diff, revisar e aplicar a migration no TiDB se houver, validar tipos/testes/build/auditoria/preflight, sincronizar o projeto com a `main`, executar smoke test do domínio publicado e somente então liberar a versão. O push do Claude no GitHub não substitui essas verificações.
