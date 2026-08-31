# Validação da Integração Controlada — Social OS

**Data:** 29/08/2026

## Escopo integrado

O `main` remoto foi integrado ao Social Studio com preservação dos controles editoriais, da Biblioteca com 108 artes, da conexão oficial de Instagram e da trilha de aprovação humana. A estrutura `automation_settings` foi aplicada após pré-validação de ausência de duplicidade em `brand_profiles.userId`.

## Identidade visual

As novas telas Social OS foram readequadas ao padrão S2 Studio: verde-carvão e verde profundo como base, bronze como destaque, marfim para conteúdos de leitura e tipografia editorial Cormorant Garamond combinada a Manrope. A geração de arte por IA também foi atualizada para solicitar fundo institucional em verde e bronze, sem texto gerado.

## Controles de operação

- O planejamento assistido gera apenas rascunhos e datas-alvo.
- A aprovação jurídica é obrigatória e não pode ser desativada na interface.
- A publicação em Instagram continua dependente de conexão Meta válida, teste não público aprovado e confirmação humana expressa.
- O Radar Jurídico consulta fontes públicas sob demanda; não cria conteúdo sem fonte vinculada.

## Evidências

- `pnpm check`: aprovado.
- `pnpm test`: aprovado com 69 testes e 1 teste externo Meta corretamente ignorado na suíte unitária.
- `pnpm build`: aprovado após divisão das rotas pesadas e consolidação das bibliotecas de fornecedor em um chunk compartilhado.
- A primeira divisão manual separava React de dependências transitivas de interface e gerava um ciclo ESM entre `vendor-react` e `vendor` no domínio publicado. O ciclo produzia `Cannot read properties of undefined (reading 'createContext')` e deixava `#root` sem montagem. A divisão foi corrigida para um único chunk de fornecedor, preservando o lazy loading das telas pesadas.
- O artefato de produção corrigido contém HTML, CSS, entrada e fornecedor compartilhado que totalizam **350,61 KiB gzip** no carregamento inicial (105,73 + 24,12 + 14,39 + 206,37 KiB), abaixo da meta interna de 500 KiB gzip. As telas pesadas permanecem em chunks carregados sob demanda.
- `pnpm audit --prod --audit-level high`: sem vulnerabilidades conhecidas após atualização compatível de AWS SDK, tRPC, Axios, Drizzle, Recharts, Streamdown e Express.
- Pré-validação da migration: aprovada depois da aplicação, sem tabelas pendentes. As tabelas Social Media OS foram efetivamente criadas.
- TiDB não suporta os triggers SQL previstos nas migrations originais. Os bloqueios de versão aprovada, mídia posterior à aprovação, confirmação, agendamento e publicação foram substituídos por guards de aplicação testados e executados no fluxo transacional.
- A migration incremental `0019_social_os_tidb_reconciliation.sql` registra o baseline efetivamente aplicado e a substituição explícita dos triggers pelos guards de aplicação, sem recriar tabelas existentes.
- O índice único de idempotência de campanhas por usuário foi aplicado após confirmação de inexistência de duplicidades.
- A mutação legada `socialStudio.generateCampaign` passou a delegar ao serviço transacional `generateCampaignSafely`, exigindo UUID idempotente e impedindo criação parcial ou duplicada no endpoint efetivamente exposto à interface.
- Express foi atualizado para a versão 5, com correção dos fallbacks SPA e da rota de armazenamento para a sintaxe de wildcard nomeado compatível.
- Endpoints `/api/health` e `/api/ready`: responderam HTTP 200. O estado Meta agora separa `instagramCredentialsConfigured` de `instagramConnectionValidated`, que permanece `false` até uma autorização OAuth válida.
- Produção validada em `https://depaulasoc-5hpbpodx.manus.space` em 29/08/2026: após a propagação do redeploy, o navegador montou o formulário de acesso dentro de `#root`, sem tela em branco. A interface autenticada permanece protegida por login, conforme esperado.
- Smoke test de produção aprovado: `/api/health`, `/api/ready` e as rotas `/`, `/command-center`, `/radar`, `/conteudos`, `/calendario`, `/automacao`, `/planejamento`, `/biblioteca`, `/fontes`, `/conhecimento`, `/redes`, `/instagram`, `/marca` e `/roadmap` responderam HTTP 200. O contrato de readiness retornou `status: "ready"`, serviço `depaula-social-os` e todos os checks internos verdadeiros.
- Rollback: não foi necessário após o redeploy corretivo. Caso uma regressão seja observada, a referência estável anterior é o checkpoint `6b593595`, recuperável pelo histórico de versões; o checkpoint corrente `81033f22` contém a correção de chunking validada em produção.
- Revisão visual: todas as rotas integradas foram capturadas em desktop e em tela móvel. As telas mantiveram legibilidade e acabamento editorial no tema institucional.
- Validação autenticada: o Radar Jurídico consultou fontes públicas e criou um rascunho com fonte TRT-MG vinculada, sem envio externo. O Planejamento Assistido persistiu preferências sem criar conteúdo ou agenda. O Design AI gerou fundo institucional, compôs e anexou uma arte JPEG 1080×1350 ao rascunho interno. A Central de Redes confirmou bloqueio da conexão e de publicação enquanto a aplicação Meta permanece pendente.
- Proteção de imagem: a geração visual utiliza a qualidade padrão estável e passa a encerrar com erro claro após 90 segundos, sem anexar mídia, caso o provedor não responda.
- Verificação estrutural do TiDB: tabelas Social Media OS e índices críticos de campanha/publicação foram consultados diretamente sem alterar dados. A pré-validação de deploy confirmou `needsMigration=false`.
- Contratos de interface: as páginas do Social Media OS não possuem mais tipagens `any`; a refatoração preservou os contratos de conteúdo, fonte, conhecimento, Growth OS, Autopilot e Instagram, com `pnpm check` e testes específicos aprovados.
- Central de Instagram: o estado agora distingue credenciais presentes de validação técnica aprovada. O OAuth é rejeitado antes de qualquer redirecionamento enquanto a validação não tiver sucesso; tela, teste de mídia e publicação comunicam o bloqueio de forma explícita.
- Checkpoint `c4f554ee`: publicado e validado em produção em 29/08/2026. O smoke test confirmou `health`, `readiness` e todas as rotas principais com HTTP 200; o repositório local e `s2corporativo/studio:main` apontam para o mesmo commit `c4f554ee205b061e1a82837c0b5aa903ba3ac350`.

## Pendência externa remanescente

A validação mínima das credenciais Meta retorna `HTTP 400 / OAuthException 101`. Isso indica que o App ID seguro não corresponde ao aplicativo DPT confirmado no painel ou não está pareado com o App Secret atual. A configuração real da API oficial do Instagram permanece condicionada a corrigir esse par e validar a autorização OAuth da conta profissional. O aplicativo DPT já possui Instagram Login, a URL de retorno de produção e as permissões mínimas configuradas. Nenhum segredo, token ou publicação pública foi criado nesta intervenção.

O GitHub Actions também foi separado das validações locais: o workflow `CI` ativo recebeu gatilho manual e foi iniciado, mas o GitHub bloqueou o job antes de sua criação porque pagamentos recentes falharam ou o limite de gastos precisa ser aumentado. Não há erro de código, YAML, runner, build, testes ou migrations atribuível ao Studio; o CI remoto deve ser reexecutado após a regularização da conta GitHub.
