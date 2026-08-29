# Validação da Integração Controlada — Social OS

**Data:** 29/08/2026

## Escopo integrado

O `main` remoto foi integrado ao Social Studio com preservação dos controles editoriais, da Biblioteca com 108 artes, da conexão oficial de Instagram e da trilha de aprovação humana. A estrutura `automation_settings` foi aplicada após pré-validação de ausência de duplicidade em `brand_profiles.userId`.

## Identidade visual

As novas telas Social OS foram readequadas ao padrão De Paula Teixeira: verde-carvão e verde profundo como base, bronze como destaque, marfim para conteúdos de leitura e tipografia editorial Cormorant Garamond combinada a Manrope. A geração de arte por IA também foi atualizada para solicitar fundo institucional em verde e bronze, sem texto gerado.

## Controles de operação

- O planejamento assistido gera apenas rascunhos e datas-alvo.
- A aprovação jurídica é obrigatória e não pode ser desativada na interface.
- A publicação em Instagram continua dependente de conexão Meta válida, teste não público aprovado e confirmação humana expressa.
- O Radar Jurídico consulta fontes públicas sob demanda; não cria conteúdo sem fonte vinculada.

## Evidências

- `pnpm check`: aprovado.
- `pnpm test`: aprovado com 67 testes e 1 teste externo Meta corretamente ignorado na suíte unitária.
- `pnpm build`: aprovado após divisão das rotas pesadas e consolidação das bibliotecas de fornecedor em um chunk compartilhado.
- A primeira divisão manual separava React de dependências transitivas de interface e gerava um ciclo ESM entre `vendor-react` e `vendor` no domínio publicado. O ciclo produzia `Cannot read properties of undefined (reading 'createContext')` e deixava `#root` sem montagem. A divisão foi corrigida para um único chunk de fornecedor, preservando o lazy loading das telas pesadas.
- O artefato de produção corrigido contém HTML, CSS, entrada e fornecedor compartilhado que totalizam **350,61 KiB gzip** no carregamento inicial (105,73 + 24,12 + 14,39 + 206,37 KiB), abaixo da meta interna de 500 KiB gzip. As telas pesadas permanecem em chunks carregados sob demanda.
- `pnpm audit --prod --audit-level high`: sem vulnerabilidades conhecidas após atualização compatível de AWS SDK, tRPC, Axios, Drizzle, Recharts, Streamdown e Express.
- Pré-validação da migration: aprovada depois da aplicação, sem tabelas pendentes. As tabelas Social Media OS foram efetivamente criadas.
- TiDB não suporta os triggers SQL previstos nas migrations originais. Os bloqueios de versão aprovada, mídia posterior à aprovação, confirmação, agendamento e publicação foram substituídos por guards de aplicação testados e executados no fluxo transacional.
- A migration incremental `0019_social_os_tidb_reconciliation.sql` registra o baseline efetivamente aplicado e a substituição explícita dos triggers pelos guards de aplicação, sem recriar tabelas existentes.
- O índice único de idempotência de campanhas por usuário foi aplicado após confirmação de inexistência de duplicidades.
- Express foi atualizado para a versão 5, com correção dos fallbacks SPA e da rota de armazenamento para a sintaxe de wildcard nomeado compatível.
- Endpoints `/api/health` e `/api/ready`: responderam HTTP 200. O estado Meta agora separa `instagramCredentialsConfigured` de `instagramConnectionValidated`, que permanece `false` até uma autorização OAuth válida.
- Smoke test: rotas `/`, `/radar`, `/conteudos`, `/calendario`, `/automacao`, `/planejamento`, `/biblioteca`, `/fontes`, `/conhecimento`, `/redes`, `/instagram`, `/marca` e `/roadmap` responderam HTTP 200. A revalidação final no domínio publicado permanece pendente desta correção de frontend.
- Revisão visual: todas as rotas integradas foram capturadas em desktop e em tela móvel. As telas mantiveram legibilidade e acabamento editorial no tema institucional.
- Validação autenticada: o Radar Jurídico consultou fontes públicas e criou um rascunho com fonte TRT-MG vinculada, sem envio externo. O Planejamento Assistido persistiu preferências sem criar conteúdo ou agenda. O Design AI gerou fundo institucional, compôs e anexou uma arte JPEG 1080×1350 ao rascunho interno. A Central de Redes confirmou bloqueio da conexão e de publicação enquanto a aplicação Meta permanece pendente.
- Proteção de imagem: a geração visual utiliza a qualidade padrão estável e passa a encerrar com erro claro após 90 segundos, sem anexar mídia, caso o provedor não responda.

## Pendência externa remanescente

A configuração real da API oficial do Instagram continua condicionada à correção das credenciais DPT e à validação de uma autorização OAuth da conta profissional. O aplicativo DPT já possui Instagram Login, a URL de retorno de produção e as permissões mínimas configuradas. Nenhum segredo, token ou publicação pública foi criado nesta intervenção.
