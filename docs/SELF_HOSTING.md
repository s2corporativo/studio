# Self-hosting do S2 Studio na VPS Contabo compartilhada

Este documento descreve como publicar o S2 Studio na VPS Contabo já usada
por EJC, Verde Limp, S2 Licitações e o runner do Woodpecker CI, sem
depender do Manus.

O container da aplicação escuta apenas em `127.0.0.1:8080` — ele nunca
fica exposto diretamente na internet. Quem recebe tráfego público é o
reverse proxy que já roda no host (Caddy ou Nginx); use o snippet
correspondente em `deploy/`.

## Pré-requisitos no host

- Docker Engine + plugin `docker compose` (v2).
- Um reverse proxy já em operação (Caddy ou Nginx) — este projeto não
  substitui o proxy existente, apenas adiciona um novo site/vhost a ele.
- DNS do subdomínio `studio.s2corporativo.com.br` apontando para o IP da
  VPS (feito fora deste repositório).

## 1. Clonar e configurar

```bash
git clone git@github.com:s2corporativo/studio.git
cd studio
cp .env.example .env
```

Edite `.env` e preencha, no mínimo:

- `JWT_SECRET` — gere um novo valor aleatório forte (`openssl rand -hex 32`).
  **Nunca reaproveite o `JWT_SECRET` de produção do Manus.**
- `VITE_APP_ID`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID` — conforme o ambiente.
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_ROOT_PASSWORD` — credenciais do
  MariaDB local que o `docker-compose.yml` sobe (banco novo e vazio,
  isolado do TiDB de produção do Manus).

Não copie o `DATABASE_URL`, o Meta App Secret nem nenhum outro segredo real
de produção para este `.env` de self-hosting — o compose gera seu próprio
`DATABASE_URL` a partir de `DB_USER`/`DB_PASSWORD`/`DB_NAME`, apontando
para o serviço `db` local.

## 2. Subir o banco e aplicar as migrations

```bash
docker compose up -d db
docker compose --profile tools run --rm migrate
```

O serviço `migrate` roda `pnpm db:migrate` (Drizzle Kit) contra o MariaDB
local usando a imagem de build (que inclui as dependências de
desenvolvimento). Ele aplica todas as migrations em `drizzle/` na ordem
registrada em `drizzle/meta/_journal.json`.

## 3. Subir a aplicação

```bash
docker compose up -d --build app
docker compose ps
```

Verifique a saúde do container:

```bash
curl -s http://127.0.0.1:8080/api/health | jq
curl -s http://127.0.0.1:8080/api/ready | jq
```

`/api/health` deve responder `"status":"ok"`. `/api/ready` só responde
`200` quando o banco está migrado e todas as tabelas essenciais existem —
é normal ver `503` antes do passo 2.

## 4. Ligar o reverse proxy do host

Escolha o snippet correspondente ao proxy já instalado na VPS:

- **Caddy**: copie o conteúdo de `deploy/Caddyfile.studio` para dentro do
  Caddyfile principal do host (ou importe o arquivo), depois
  `caddy reload`.
- **Nginx**: copie `deploy/nginx-studio.conf` para
  `/etc/nginx/sites-available/studio.s2corporativo.com.br`, ajuste os
  caminhos de certificado TLS para o que o host já usa (certbot, acme.sh
  etc.), crie o symlink em `sites-enabled/` e rode `nginx -t && systemctl
  reload nginx`.

Nenhum dos dois snippets mexe na configuração dos outros sites já
publicados no host.

## 5. Atualizações subsequentes

```bash
git pull origin main
docker compose --profile tools run --rm migrate   # se houver migration nova
docker compose up -d --build app
```

## Riscos e o que este documento não resolve

- **Segredos vazados no histórico do `main` antigo.** Um `.env` de
  produção real (`JWT_SECRET`, `DATABASE_URL`, `OAUTH_SERVER_URL`,
  `OWNER_OPEN_ID`, `VITE_APP_ID`) permanece recuperável no histórico do
  Git deste repositório. Isso é independente da hospedagem e precisa ser
  tratado separadamente (rotação de credenciais reais + reescrita ou
  substituição do histórico), não é resolvido por este guia.
- Este guia sobe um MariaDB **novo e vazio**, isolado do TiDB de produção
  usado pelo Manus. Migrar dados reais para cá é uma decisão humana
  separada, fora deste documento.
- Backups do volume `studio_db_data` (usado pelo MariaDB local) não estão
  automatizados aqui — configure rotina de backup no host antes de
  depender deste banco para dados reais.
