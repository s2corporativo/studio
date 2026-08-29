# Status de Liberação Condicional — De Paula Social Studio

**Data da consolidação:** 29/08/2026  
**Checkpoint publicado:** `c4f554ee`  
**Produção:** `https://depaulasoc-5hpbpodx.manus.space`  
**Escopo:** Social Media OS interno para planejamento, criação, revisão, governança, biblioteca de artes, automação assistida e distribuição jurídica responsável.

## Resultado direto

O Social Media OS está **liberado para operação interna controlada**. A produção respondeu corretamente aos endpoints de saúde e prontidão, todas as rotas principais responderam HTTP 200, e o repositório GitHub está sincronizado no commit do checkpoint publicado.

A integração externa oficial do Instagram está **intencionalmente bloqueada**. As credenciais estão presentes no cofre, mas a Meta recusou a validação mínima com `OAuthException 101`; portanto, não foi iniciado OAuth de conta profissional, não houve container de teste e nenhuma postagem pública foi enviada. O bloqueio é uma salvaguarda funcional, não uma falha silenciosa.

| Área | Situação comprovada | Evidência |
|---|---|---|
| Produção | Aprovada para uso interno | `/api/health`, `/api/ready` e 14 rotas principais com HTTP 200 |
| Build e tipos | Aprovados | `pnpm check` e `pnpm build` concluídos |
| Testes | Aprovados | 69 testes aprovados; 1 teste Meta externo mantido manual/ignorado |
| Dependências | Aprovadas | `pnpm audit --prod --audit-level high`: sem vulnerabilidades críticas ou altas conhecidas |
| Banco TiDB | Aprovado | Preflight sem migrations pendentes; baseline `0019` aplicado |
| Campanhas | Aprovadas | Endpoint usa transação e UUID de idempotência por usuário |
| Governança jurídica | Aprovada | Revisão, aprovação vinculada, imutabilidade de mídia e confirmação humana testadas |
| Instagram/Meta | Bloqueado com segurança | Credenciais não validadas; OAuth, teste não público e publicação indisponíveis |
| GitHub Actions | Dependência externa | Job não inicia por pagamento/limite de gastos da conta GitHub |

## Observações técnicas essenciais

O cliente React foi corrigido para evitar o ciclo entre chunks de fornecedor que deixava o domínio publicado com tela em branco. O primeiro carregamento medido, somando HTML, CSS, entrada e fornecedor compartilhado, é de **350,61 KiB gzip**, abaixo da meta interna de 500 KiB. Rotas pesadas continuam carregadas sob demanda.

As estruturas Social Media OS foram reconciliadas no TiDB pela migration `0019_social_os_tidb_reconciliation.sql`. Como o TiDB não suporta triggers, os controles equivalentes são executados por guards de aplicação e fluxos transacionais. Isso abrange aprovação vinculada, invalidação de aprovação por alteração, bloqueio de mídia após aprovação, confirmação de publicação e agenda protegida.

O endpoint real de geração de campanhas passou a chamar o serviço transacional idempotente. A interface também foi revisada para remover contratos amplos: as páginas do Social Media OS não possuem tipagens `any` remanescentes, e a Central de Redes apresenta o Instagram como **“Validação pendente”**, jamais como conexão ativa enquanto a verificação técnica da Meta não estiver aprovada.

> O conteúdo jurídico permanece estritamente informativo. A criação de rascunho, aprovação e conexão externa são etapas distintas; nenhuma delas substitui revisão humana. Toda peça ou publicação jurídica gerada com assistência de IA requer revisão profissional antes de qualquer divulgação.

## Bloqueios externos e critérios para remoção

| Bloqueio | Efeito no sistema | Ação necessária | Critério de encerramento |
|---|---|---|---|
| Meta `OAuthException 101` | OAuth, teste não público e publicação permanecem desabilitados | Corrigir o App ID no cofre para o app DPT e, se necessário, regenerar e parear o App Secret | `pnpm test:meta-credentials` aprovado uma única vez |
| OAuth da conta profissional | Não há perfil profissional oficialmente autorizado | Após as credenciais válidas, concluir o OAuth da conta institucional pelo fluxo oficial | Estado persistido `connected` com permissões adequadas |
| Teste não público | Publicação e agenda continuam bloqueadas | Executar container temporário após OAuth válido e mídia JPEG aprovada | Teste registrado com `testedAt` e `testContainerId` |
| GitHub Actions | CI remoto não criou jobs | Regularizar pagamento recente ou limite de gastos da conta GitHub | Workflow `CI` iniciado e concluído com sucesso |

Nenhuma senha, token, App Secret, dado de cliente ou conteúdo sigiloso foi exposto, exportado ou armazenado no repositório. O relato técnico da Meta se limita ao status HTTP e ao código `101`, suficientes para diagnóstico sem revelar credenciais.

## Próximo passo concreto

Atualize o **App ID** correspondente ao DPT no formulário seguro já disponibilizado e, se o App Secret tiver sido regenerado, atualize também o Secret pareado. Após responder **“credenciais atualizadas”**, será executada uma única validação técnica sem OAuth, mídia ou publicação pública.

## Referências

[1] [Meta for Developers — Access Tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/)  
[2] [Meta for Developers — Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/)
