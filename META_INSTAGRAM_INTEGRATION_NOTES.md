# Integração oficial do Instagram — requisitos confirmados

## Fonte consultada

- Meta for Developers, **Content Publishing**, atualizada em 30/06/2026: https://developers.facebook.com/documentation/instagram-platform/content-publishing
- Meta for Developers, **IG User Media**, atualizada em 12/08/2026: https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media

## Requisitos do fluxo escolhido

O Social Studio usará a Instagram API para contas profissionais com login do Instagram. A aplicação precisa de acesso Standard ou Advanced e das permissões `instagram_business_basic` e `instagram_business_content_publish`. O fluxo exige token de usuário Instagram, mídia hospedada em endereço publicamente acessível e conta profissional vinculada de forma elegível.

## Regras que o produto deve aplicar

- Cada publicação passa por criação de container em `/<IG_ID>/media` e por envio em `/<IG_ID>/media_publish`.
- Containers expiram após 24 horas; portanto, o envio deve ocorrer próximo ao horário agendado e ser idempotente.
- JPEG é o formato aceito para imagens; cada arquivo deve ter até 8 MB, em sRGB e proporção entre 4:5 e 1,91:1.
- Carrosséis podem ter até 10 mídias e contam como uma publicação no limite diário.
- Há limite de publicações por API em janela móvel de 24 horas. O sistema deve consultar `/<IG_ID>/content_publishing_limit` antes do envio.
- A legenda admite até 2.200 caracteres, 30 hashtags e 20 menções.
- Conteúdos marcados como gerados por IA devem permitir a flag `is_ai_generated=true` quando aplicável.
- O sistema não deve publicar conteúdo sem status aprovado, fonte vinculada, data de revisão e confirmação humana registrada.

## Pré-requisitos pendentes do usuário

1. Concluir o login e a verificação em duas etapas da conta `@depaulateixeira.adv` no navegador.
2. Criar ou selecionar a aplicação no Meta for Developers e habilitar o produto Instagram API.
3. Informar em canal seguro o App ID e o App Secret para serem armazenados como variáveis de ambiente do projeto.
4. Após o próximo checkpoint, publicar o Social Studio e cadastrar a URL de retorno oficial no painel da Meta.

## Estado da autenticação em 27/08/2026

A autenticação da conta profissional no Instagram avançou após a verificação em duas etapas. A Meta identificou que o perfil está associado a uma conta Meta existente e solicita o login nessa conta para prosseguir ao painel de desenvolvedores. Nenhum código de verificação, senha, telefone ou token foi registrado neste documento.

## Limitação identificada após autenticação

Em 27/08/2026, a sessão autenticada abriu o painel Meta Horizon da equipe, mas a rota pública de aplicações de tecnologias sociais retornou indisponível para essa sessão. Antes de configurar a Instagram API, é necessário confirmar no Meta for Developers de tecnologias sociais se a conta possui acesso de desenvolvedor e se existe uma aplicação elegível. Essa validação deve ser feita no painel correto antes de inserir qualquer credencial no Social Studio.

## Bloqueio de aplicações sociais

Após a autenticação, o Business Manager da empresa informou que não há aplicativos acessíveis à conta comercial. A rota de criação de aplicativo também retornou indisponível para a sessão atual. Para continuar, um administrador com acesso ao painel de aplicativos de tecnologias sociais precisa criar ou atribuir uma aplicação elegível à empresa e conceder acesso à conta usada na configuração.

## Estado da conta comercial após autenticação

O login da conta Meta existente foi concluído e abriu a Meta Business Suite da empresa. A área de aplicativos informa que não há aplicativo associado ou acessível à conta comercial. O fluxo de integração oficial continua dependente de uma aplicação de tecnologias sociais da Meta com a Instagram API habilitada e atribuída à empresa.

Em nova verificação realizada em 27/08/2026, o painel **Apps** da empresa continuou exibindo “Nenhum aplicativo encontrado” e orientou a solicitar acesso a um administrador da conta comercial. A conta autenticada pode acessar a Business Suite, mas ainda não possui aplicativo social elegível para a integração.

## Implementação preparada no Social Studio

O Social Studio agora possui as tabelas `instagram_connections`, `content_media`, `publication_jobs` e `publication_attempts`. O token da conta é protegido no servidor por criptografia autenticada; ele nunca é enviado ao navegador, exibido na interface ou salvo em logs funcionais.

A central **Instagram** permite selecionar apenas conteúdo aprovado, armazenar JPEGs vinculados ao conteúdo e executar pré-publicação com bloqueio de fonte, base jurídica, afirmação-chave, revisão vigente, responsável, mídia JPEG, dimensões, proporção, legenda, hashtags, menções, termos vedados e conexão ativa. A versão válida é congelada antes da solicitação, e a API só pode ser chamada depois de uma confirmação humana expressa.

O código inclui OAuth do Instagram Login, troca de token no servidor, consulta de limite de publicação, criação de container, publicação de imagem única ou carrossel e registro de tentativas. Também foi preparado o endpoint idempotente para publicação agendada. Nenhum agendamento foi criado: esta etapa exige checkpoint, publicação do Social Studio e as credenciais da aplicação Meta.

Antes da confirmação final, cada versão congelada precisa passar por um teste não público de ponta a ponta. Para imagem única, o teste cria um container temporário; para carrossel, valida todas as mídias e o container de carrossel. O fluxo nunca chama o endpoint de publicação durante essa validação. O resultado é auditável e bloqueia publicação e agendamento enquanto não houver aprovação de teste.

## Variáveis seguras ainda necessárias

Depois que a aplicação de tecnologias sociais estiver acessível, cadastre exclusivamente no gerenciador seguro do projeto `META_INSTAGRAM_APP_ID` e `META_INSTAGRAM_APP_SECRET`. Configure no painel da Meta a URL de retorno pública exatamente como `https://<domínio-publicado>/api/instagram/oauth/callback`, habilite Instagram Login e solicite `instagram_business_basic` e `instagram_business_content_publish`. Enquanto o aplicativo estiver em desenvolvimento, vincule a conta profissional como conta de teste/usuário com acesso permitido.

## Domínio de produção

O Social Studio está publicado em `https://depaulasoc-5hpbpodx.manus.space`. A rota `https://depaulasoc-5hpbpodx.manus.space/instagram` respondeu corretamente e permanece protegida por autenticação. Quando o aplicativo Meta estiver disponível, a URL de retorno a cadastrar será `https://depaulasoc-5hpbpodx.manus.space/api/instagram/oauth/callback`.

O servidor utiliza essa origem publicada para a autorização e para o callback OAuth em produção. Assim, o endereço cadastrado na Meta não depende de valores recebidos em cabeçalhos de origem da requisição.

O endpoint de agendamento em produção foi verificado em 27/08/2026. Uma chamada sem credencial de tarefa recebeu a resposta `permission error for cron cookie`, confirmando que a execução não é acessível publicamente. A infraestrutura de agendamento está publicada, sem tarefas criadas até que a conexão oficial e o teste não público sejam concluídos.

## Situação de permissões

Nas configurações de pessoas da Meta Business Suite, a conta autenticada de Clovis Soares foi exibida com **Acesso total** ao portfólio empresarial e à conta `@depaulateixeira.adv`. A criação do aplicativo, contudo, exige o registro separado de uma conta pessoal de Facebook como desenvolvedor no portal Meta for Developers. O redirecionamento para esse registro já foi identificado; esta etapa permanece para o usuário concluir em momento oportuno.
