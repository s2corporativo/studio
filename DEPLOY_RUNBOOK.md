# Deploy seguro — De Paula Social OS

Este runbook deve ser usado para atualizar o ambiente Manus existente sem recriar banco, storage, usuários ou segredos.

## 1. Pré-requisitos

- fonte de verdade: `s2corporativo/studio`, branch `main`;
- ambiente de produção existente: `https://depaulasoc-5hpbpodx.manus.space`;
- preservar todas as variáveis de ambiente existentes;
- nunca executar reset/drop de banco;
- publicação externa deve continuar dependente de confirmação humana.

## 2. Antes do deploy

Executar no ambiente que possui `DATABASE_URL`:

```bash
pnpm deploy:preflight
```

O comando apenas lê o schema e verifica:

- existência do schema base;
- duplicidades em `brand_profiles.userId`;
- presença do índice `brand_profiles_user_unique`;
- presença e compatibilidade de `automation_settings`.

Se forem encontradas duplicidades ou estrutura incompatível, o processo aborta sem remover ou alterar dados.

## 3. Aplicar a migration Social OS

Somente após preflight seguro:

```bash
pnpm deploy:migrate:social-os
```

O aplicador é idempotente: cria somente o índice/tabela ausentes e faz verificação final. Não executa `DROP`, `TRUNCATE` ou reset de schema.

A migration SQL `drizzle/0009_social_os_automation.sql` permanece como histórico do schema, mas para produção deve ser preferido o aplicador seguro acima.

## 4. Build e inicialização

```bash
pnpm check
pnpm test
pnpm build
```

Promover a versão somente se os comandos concluírem sem erro.

## 5. Health e readiness

Após iniciar a aplicação:

- `GET /api/health` — confirma que o processo HTTP está operacional e informa apenas booleanos de configuração, nunca segredos;
- `GET /api/ready` — exige runtime base, conexão com banco e presença da migration Social OS. Retorna HTTP 503 enquanto o ambiente não estiver pronto.

## 6. Smoke test do domínio

```bash
BASE_URL=https://depaulasoc-5hpbpodx.manus.space pnpm smoke:production
```

O teste valida `/api/health`, `/api/ready` e as rotas principais:

`/`, `/radar`, `/conteudos`, `/calendario`, `/automacao`, `/planejamento`, `/biblioteca`, `/fontes`, `/conhecimento`, `/redes`, `/instagram`, `/marca`, `/roadmap`.

## 7. Validação funcional sem publicação externa

1. autenticar com conta existente;
2. abrir Radar Jurídico e criar um rascunho a partir de fonte oficial;
3. salvar configurações do Piloto Automático e gerar plano em rascunho;
4. gerar uma arte de teste e composição JPEG 1080×1350;
5. confirmar que material privado de `/conhecimento` exige autenticação/propriedade;
6. validar Compliance Engine com texto neutro e texto bloqueável;
7. verificar configuração Meta sem revelar segredo;
8. executar somente preflight/container não público do Instagram quando possível;
9. não executar `media_publish` real sem confirmação humana explícita.

## 8. Rollback

Se a aplicação nova falhar antes de alteração de dados funcional:

- voltar o runtime para o commit anterior estável;
- não remover `automation_settings` nem o índice único automaticamente, pois ambos são aditivos e compatíveis com o schema novo;
- registrar a falha com logs e endpoint `/api/ready`.

## 9. Bloqueios externos conhecidos

- acesso operacional ao ambiente Manus precisa estar autenticado;
- credenciais/aprovação da Meta podem ser necessárias para OAuth e teste não público;
- GitHub Actions do repositório apresentou `startup_failure` mesmo com workflow mínimo, portanto a validação de build deve ser executada no ambiente de deploy até o runner ser normalizado.
