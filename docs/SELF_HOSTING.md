# Hospedagem própria — `studio.s2corporativo.com.br`

Runbook para publicar o Social Studio numa VPS própria (não Manus), a partir do zero. Cobre a Fase 1/3 do plano de independência do Manus: hospedagem, banco de dados e reverse proxy. O login continua, por decisão deliberada desta fase, apontando para a API de autenticação do Manus (`OAUTH_SERVER_URL`) — ver `AI_PROVIDER_OPTIONS.md` e a seção "Dependências remanescentes" abaixo para o que falta para independência total.

## Pré-requisitos na VPS

- Docker Engine + o plugin `docker compose` instalados.
- Um reverse proxy já rodando na VPS (Caddy **ou** Nginx) cuidando de HTTPS para os outros sistemas do ecossistema (EJC, Verde Limp, S2 Licitações). Este runbook **acrescenta** um site novo a ele — não substitui nada existente.
- Acesso para criar um registro DNS tipo `A` para `studio.s2corporativo.com.br` apontando para o IP público da VPS.

## 1. DNS

Crie, no provedor onde o domínio `s2corporativo.com.br` está gerenciado, um registro:

```
Tipo:  A
Nome:  studio
Valor: <IP público da VPS>
TTL:   automático (ou 300s)
```

Propagação costuma levar de alguns minutos a poucas horas.

## 2. Clonar o repositório na VPS

```bash
git clone https://github.com/s2corporativo/studio.git
cd studio
```

Para atualizar depois: `git pull origin main`.

## 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env`:

- `JWT_SECRET`: gere com `openssl rand -base64 48`. Nunca reutilize o mesmo valor do ambiente Manus.
- `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`: credenciais do banco novo (o `docker-compose.yml` já sobe um MariaDB só para este app).
- `DATABASE_URL`: pode deixar como está — o `docker-compose.yml` monta a string de conexão sozinho a partir das variáveis `MYSQL_*` acima.
- `VITE_APP_ID` e `OAUTH_SERVER_URL`: copie os mesmos valores já usados no ambiente Manus, para o login continuar funcionando (ver "Dependências remanescentes").
- `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` / `LLM_MODEL`: provedor de IA de texto. Pode reaproveitar as credenciais do Manus (mesma API compatível com OpenAI) ou trocar por Groq/OpenRouter — ver `AI_PROVIDER_OPTIONS.md`.
- `META_INSTAGRAM_APP_ID` / `META_INSTAGRAM_APP_SECRET`: mesmas credenciais já usadas hoje, se for reaproveitar a mesma integração Instagram.

## 4. Subir os containers

```bash
docker compose up -d --build
docker compose ps
```

O app fica disponível só em `127.0.0.1:8080` no host — de propósito, para não brigar com o reverse proxy existente nem expor a porta direto à internet.

## 5. Aplicar as migrations (banco novo, vazio)

```bash
docker compose exec app pnpm exec drizzle-kit migrate
node scripts/validate-migrations.mjs   # ou: docker compose exec app node scripts/validate-migrations.mjs
```

As 22 migrations existentes montam o schema completo. Não é preciso rodar `deploy:preflight`/`deploy:migrate:social-os` num banco novo e vazio — esses scripts existem para reconciliar um banco que já tinha dados (o caso do Manus); aqui o caminho direto do Drizzle já resolve.

## 6. Ligar o domínio ao app (reverse proxy)

Se a VPS já usa **Caddy**: acrescente o conteúdo de `deploy/Caddyfile.studio` ao `Caddyfile` existente e recarregue (`caddy reload` ou reinicie o serviço/container do Caddy).

Se a VPS já usa **Nginx**: copie `deploy/nginx-studio.conf` para `/etc/nginx/sites-available/studio.s2corporativo.com.br`, ative com um symlink em `sites-enabled`, teste (`sudo nginx -t`) e recarregue. Depois rode `sudo certbot --nginx -d studio.s2corporativo.com.br` para o HTTPS.

## 7. Validar

```bash
curl https://studio.s2corporativo.com.br/api/health
curl https://studio.s2corporativo.com.br/api/ready
BASE_URL=https://studio.s2corporativo.com.br node scripts/smoke-production.mjs
```

O smoke test já existente no repositório cobre as 16 rotas principais + health/ready — os mesmos critérios usados para validar o ambiente Manus.

## Dependências remanescentes do Manus (deliberadas nesta fase)

| Área | Estado nesta fase | Para ficar 100% independente |
|---|---|---|
| Hospedagem/deploy | ✅ Resolvido — roda na VPS própria | — |
| Banco de dados | ✅ Resolvido — MariaDB próprio | — |
| Login | ⏳ Continua via API do Manus (`OAUTH_SERVER_URL`) | Trocar por outro provedor (Google, e-mail/senha, etc.) — fase futura, decidida deliberadamente para depois |
| IA de texto | ✅ Portável — `LLM_MODEL` + qualquer provedor compatível com OpenAI | — |
| Geração de imagem | ⏳ Ainda usa o protocolo `images.v1.ImageService` do Manus | Adaptador para outro provedor (ex.: OpenAI Images) |
| Armazenamento de mídia | ⏳ Ainda usa o proxy `/manus-storage` (presign do Forge) | Bucket S3-compatível real via `@aws-sdk/client-s3`, já presente nas dependências |

## Segurança e capacidade

- A VPS é compartilhada com EJC, Verde Limp, S2 Licitações e o Woodpecker CI. O `docker-compose.yml` deste projeto não expõe portas além do necessário e usa um MariaDB leve dedicado (não compete por banco com os outros sistemas).
- Monitore `docker stats` após subir, especialmente em janelas em que os outros sistemas também estejam sob carga.
- Nunca commite o `.env` real — ele já está no `.gitignore` do projeto.
