# Validação da Integração Controlada — Social OS

**Data:** 28/08/2026

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
- `pnpm test`: aprovado com 36 testes em 12 arquivos.
- Pré-validação da migration: aprovada antes e depois da aplicação, sem duplicidade e sem estruturas pendentes.
- Endpoint `/api/ready`: respondeu `ready` com banco e migration Social OS confirmados.
- Smoke test: rotas `/`, `/radar`, `/conteudos`, `/calendario`, `/automacao`, `/planejamento`, `/biblioteca`, `/fontes`, `/conhecimento`, `/redes`, `/instagram`, `/marca` e `/roadmap` responderam HTTP 200.
- Revisão visual: todas as rotas integradas foram capturadas em desktop e em tela móvel. As telas mantiveram legibilidade e acabamento editorial no tema institucional.
- Validação autenticada: o Radar Jurídico consultou fontes públicas e criou um rascunho com fonte TRT-MG vinculada, sem envio externo. O Planejamento Assistido persistiu preferências sem criar conteúdo ou agenda. O Design AI gerou fundo institucional, compôs e anexou uma arte JPEG 1080×1350 ao rascunho interno. A Central de Redes confirmou bloqueio da conexão e de publicação enquanto a aplicação Meta permanece pendente.
- Proteção de imagem: a geração visual utiliza a qualidade padrão estável e passa a encerrar com erro claro após 90 segundos, sem anexar mídia, caso o provedor não responda.

## Pendência externa remanescente

A configuração real da API oficial do Instagram continua condicionada ao registro da conta pessoal como desenvolvedor Meta e à disponibilidade de um aplicativo Meta habilitado para Instagram API. Nenhum segredo, token ou publicação pública foi criado nesta intervenção.
