# Brand Pack — S2 Studio

Fonte versionada de memória editorial e visual do Studio. Este diretório contém somente dados curados e seguros para o produto; não contém credenciais, OAuth, logs, migrations, dumps, HTML de sessão ou arte binária de produção.

## Origem e integridade

O pacote editorial recebido em 29/08/2026 misturava conteúdo de marketing com arquivos internos do sistema. O inventário canônico (`assets.expected.txt`) registra 108 imagens: 30 peças individuais e 13 carrosséis de 6 lâminas. O ZIP achatado preservou 82 imagens e perdeu 26 caminhos por colisão/sobrescrita de nomes repetidos. A auditoria exata está em `flattened-package-audit.json`.

As imagens originais não devem ser commitadas no Git (mais de 400 MB). O Studio já possui importação para object storage. Git armazena apenas metadados, regras e conhecimento curado.

## Uso

- `pnpm brand:validate` valida o inventário e, quando disponível, as pastas originais no host.
- `pnpm brand:import` executa somente dry-run.
- `pnpm brand:import -- --apply` atualiza a memória da marca e envia os documentos curados para o object storage, sem publicar conteúdo social.

## Governança

A presença neste pack não equivale a aprovação para postagem. Fontes, legislação, datas e afirmações jurídicas devem ser revalidadas antes da publicação e o fluxo de aprovação humana do Studio permanece obrigatório.
