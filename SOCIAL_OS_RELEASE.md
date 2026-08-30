# De Paula Social OS — Release 2026-08-27

## Publicado no `main`

- Redesign SaaS tech premium e nova navegação operacional.
- Dashboard com visão do pipeline, agenda e ações rápidas.
- Radar Jurídico com feeds oficiais do STJ e TRT-MG.
- Criação de rascunho a partir de item do Radar com fonte vinculada.
- Piloto Automático com preferências persistentes e planos de 7, 15 e 30 dias.
- Central de Redes com Instagram via OAuth oficial e espaço controlado para futuras integrações Facebook, LinkedIn e TikTok.
- Geração de conceito visual por IA sem texto e Design Engine para composição final 1080x1350.
- Compliance Engine para promessas de resultado, captação direta, preços/promoções, comparações e termos proibidos da marca.
- Proteção de documentos privados da base de conhecimento e validação de assinatura de arquivo no upload.
- Publicação Instagram endurecida com espera do processamento dos containers, tratamento de erro/expiração e trava atômica contra execução duplicada.
- Migration `drizzle/0009_social_os_automation.sql` para configurações do Piloto Automático.

## Dependências externas para ativação integral

1. Aplicar as migrations do banco no ambiente publicado.
2. Configurar/validar as credenciais da aplicação Meta (`META_INSTAGRAM_APP_ID` e `META_INSTAGRAM_APP_SECRET`) no ambiente seguro.
3. Concluir a autorização OAuth da conta profissional do Instagram pelo próprio dashboard.
4. Facebook, LinkedIn e TikTok ainda não possuem conectores efetivos nesta release; a interface os apresenta como futuras integrações, sem simular funcionamento.
5. O GitHub Actions deste repositório não inicia runners: três testes, incluindo um workflow mínimo contendo somente `echo`, encerraram como `startup_failure` antes da criação de qualquer job. O workflow foi removido para não marcar todos os pushes como falhos. É necessário revisar Actions/billing/políticas/runners nas configurações da conta/repositório antes de reativar CI hospedado no GitHub.

## Validações realizadas nesta intervenção

- Comparação limpa contra o `main` anterior: um único commit funcional no PR, sem arquivo de staging temporário.
- Verificação estática de sintaxe dos arquivos TypeScript/TSX e resolução dos imports locais durante a preparação.
- Teste local isolado do Compliance Engine para promessa de resultado, captação direta e conteúdo informativo.
- Revisão pós-merge das rotas, navegação, integração do editor existente, storage privado e fluxo de containers do Instagram.

## Observação de implantação

Merge no GitHub não equivale a deploy do ambiente executável. O código está publicado no repositório; o ambiente que hospeda o Social Studio precisa consumir o `main`, executar a migration e possuir as variáveis/serviços externos configurados para que as novas funções apareçam em produção.
