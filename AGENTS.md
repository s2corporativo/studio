# AGENTS.md — S2 Studio

Regras obrigatórias para qualquer agente de IA que altere este repositório.

## Missão do sistema

O Studio é um SaaS de criação, planejamento, aprovação e publicação de conteúdo em redes sociais. Alterações devem preservar confiabilidade de agendamento, credenciais de plataformas, identidade visual, rastreabilidade e experiência de usuário profissional.

## Antes de criar código

1. Pesquise componentes, rotas, serviços, tabelas, integrações e scripts existentes.
2. Não crie implementação paralela para funcionalidade já existente.
3. Identifique a camada canônica antes de refatorar.
4. Preserve migrations e compatibilidade de dados.
5. Mudanças em publicação/agendamento devem considerar idempotência, retry e prevenção de postagem duplicada.

## Validação mínima

O projeto usa pnpm. Antes de finalizar alteração relevante:

- `pnpm check`
- `pnpm test`
- `pnpm build`

Para mudanças de deploy/social OS, execute também os preflights específicos existentes quando aplicáveis.

## Integrações sociais

- Nunca simular publicação bem-sucedida quando a API externa falhou.
- Tokens Meta/Instagram e de outras redes nunca podem ser persistidos em logs ou commitados.
- Diferencie claramente estado local, agendado, enviado, confirmado, rejeitado e erro recuperável.
- Webhooks devem ser autenticados/validados e processados de forma idempotente.

## IA e conteúdo

- Conteúdo factual/noticioso deve preservar fonte e data quando essa informação for usada para gerar publicação.
- Não apresentar conteúdo inventado como notícia real.
- Geração de arte/copy deve permanecer separada do ato de publicar; publicação requer estado aprovado conforme a regra do produto.

## Banco e migrations

- Use o fluxo Drizzle já existente (`db:generate`/`db:migrate`).
- Não editar migration já aplicada para alterar histórico.
- Nunca executar alteração destrutiva contra produção sem backup verificável e plano de rollback.

## Segurança

- Segredos somente via secrets/variáveis de ambiente.
- Não reduzir autenticação, autorização ou validação para fazer teste passar.
- Dependência nova exige necessidade real e revisão de segurança.
- Mudanças em credenciais, OAuth, webhooks ou publicação devem receber atenção de segurança antes do merge.

## Regra de entrega

Faça mudanças em branch própria e PR. O PR deve informar: problema, causa, arquivos alterados, validações executadas, riscos residuais, migrations e impacto em integrações externas.
