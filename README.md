# S2 STUDIO

Plataforma SaaS profissional para produção, gerenciamento, aprovação, programação e publicação de conteúdo para redes sociais utilizando inteligência artificial.

## Visão Geral

O S2 Studio é uma plataforma completa de gestão de conteúdo para redes sociais que cobre todo o fluxo:

```
Marca → Estratégia → Ideia → Conteúdo → Arte → Legenda → Revisão → Aprovação → Agendamento → Publicação → Métricas
```

## Stack Tecnológica

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend**: Express + tRPC + Drizzle ORM
- **Database**: SQLite (via bun:sqlite)
- **AI**: z-ai-web-dev-sdk (LLM, geração de imagens, visão)
- **Auth**: JWT-based com OAuth2 ready

## Funcionalidades

### Core
- ✅ Dashboard executivo com KPIs e atividade recente
- ✅ Múltiplas marcas/workspaces
- ✅ Brand Kit com identidade visual
- ✅ Calendário editorial (diário/semanal/mensal)
- ✅ Editor de conteúdo com versionamento
- ✅ Biblioteca de mídia
- ✅ Workflow de aprovação (rascunho → revisão → aprovado → agendado → publicado)

### IA
- ✅ Geração de conteúdo (legendas, hashtags, variações por plataforma)
- ✅ Geração de imagens
- ✅ Análise de tendências por nicho
- ✅ Auto-resposta a menções negativas
- ✅ Agendamento inteligente (melhores horários)
- ✅ Brand Guardian (avaliação de aderência de marca)

### Social
- ✅ Instagram (Graph API ready)
- ✅ Facebook (Graph API ready)
- ✅ LinkedIn (Marketing API ready)
- ✅ Twitter/X (API v2 ready)
- ✅ TikTok (Business API ready)
- ✅ YouTube (Data API v3 ready)
- ✅ Google Meu Negócio
- ✅ Google Analytics

### Analytics
- ✅ Métricas de engajamento por plataforma
- ✅ Performance de hashtags
- ✅ Relatórios de ROI
- ✅ Social Listening (menções com análise de sentimento)
- ✅ Análise de concorrentes

### Avançado
- ✅ Conteúdo Evergreen (republicação automática)
- ✅ Integração JusBrasil (jurisprudência)
- ✅ Multi-usuário com aprovação hierárquica
- ✅ White-label customizável
- ✅ Calendário export (iCal/CSV)
- ✅ Command Palette (Ctrl+K)
- ✅ Notificações em tempo real (SSE)

## Instalação

```bash
# Instalar dependências
bun install

# Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# Criar banco de dados
bun drizzle-kit generate
bun drizzle-kit push

# Iniciar servidor de desenvolvimento
bun run dev
```

## Estrutura do Projeto

```
├── client/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── components/  # Componentes UI
│   │   ├── hooks/       # Hooks customizados
│   │   ├── lib/         # Utils e configurações
│   │   └── contexts/    # Context providers
├── server/              # Backend (Express + tRPC)
│   ├── _core/           # Core (auth, env, trpc setup)
│   ├── routers/         # tRPC routers por domínio
│   └── socialhub/       # APIs REST do S2 Studio
├── shared/              # Código compartilhado
├── drizzle/             # Schema e migrations
└── drizzle.config.ts    # Configuração do Drizzle ORM
```

## Desenvolvimento

```bash
# Desenvolvimento (com hot reload)
bun run dev

# Type check
bun run check

# Build
bun run build

# Testes
bun run test
```

## Variáveis de Ambiente

Veja `.env.example` para a lista completa. As principais:

| Variável | Descrição | Obrigatório |
|---|---|---|
| `DATABASE_URL` | Caminho do banco SQLite | ✅ |
| `JWT_SECRET` | Secret para JWT | ✅ |
| `VITE_APP_ID` | ID da aplicação | ✅ |
| `META_INSTAGRAM_APP_ID` | App ID do Meta | Para Instagram real |
| `META_INSTAGRAM_APP_SECRET` | App Secret do Meta | Para Instagram real |

## Roadmap

- [ ] OAuth real para todas as plataformas
- [ ] Publicação automática via worker
- [ ] WebSocket para notificações
- [ ] Redis para filas
- [ ] Docker Compose para produção
- [ ] CI/CD com GitHub Actions

## Licença

MIT
