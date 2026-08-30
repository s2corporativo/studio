/**
 * Configuração das integrações de API reais para redes sociais.
 * Este arquivo documenta TODAS as APIs necessárias para sincronizar
 * e escalar empresas na internet.
 */

export interface PlatformIntegration {
  platform: string
  label: string
  color: string
  bgColor: string
  icon: string
  // Documentação da API
  apiName: string
  apiDocsUrl: string
  authType: 'oauth2' | 'api_key' | 'oauth1'
  // O que a API permite fazer
  capabilities: {
    posting: boolean
    analytics: boolean
    mentions: boolean
    stories: boolean
    reels: boolean
    scheduling: boolean
    insights: boolean
    directMessage: boolean
  }
  // Requisitos para conectar
  requirements: {
    apiKey?: string
    apiSecret?: string
    accessToken?: string
    refreshToken?: string
    businessAccountId?: string
    webhookUrl?: boolean
    appReview?: boolean
  }
  // Limites da API
  rateLimits: string
  // Scopes necessários
  scopes: string[]
  // Passos para configurar
  setupSteps: string[]
  // Status da integração
  status: 'available' | 'beta' | 'coming_soon'
  // Custo
  pricing: string
  // Funcionalidades premium
  premium: string[]
}

export const PLATFORM_INTEGRATIONS: PlatformIntegration[] = [
  {
    platform: 'instagram',
    label: 'Instagram',
    color: '#E1306C',
    bgColor: '#FCE7F3',
    icon: 'instagram',
    apiName: 'Instagram Graph API',
    apiDocsUrl: 'https://developers.facebook.com/docs/instagram-api',
    authType: 'oauth2',
    capabilities: {
      posting: true,
      analytics: true,
      mentions: true,
      stories: true,
      reels: true,
      scheduling: true,
      insights: true,
      directMessage: false,
    },
    requirements: {
      apiKey: 'App ID do Meta',
      apiSecret: 'App Secret do Meta',
      accessToken: 'Access Token de longa duração',
      businessAccountId: 'Instagram Business Account ID',
      webhookUrl: true,
      appReview: true,
    },
    rateLimits: '200 chamadas/hora por usuário',
    scopes: [
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_comments',
      'instagram_manage_insights',
      'pages_read_engagement',
      'pages_show_list',
    ],
    setupSteps: [
      'Criar conta no Meta for Developers (developers.facebook.com)',
      'Criar um App do tipo "Business"',
      'Adicionar produto Instagram Graph API',
      'Configurar login OAuth com os scopes necessários',
      'Solicitar revisão do app (App Review) para permissões públicas',
      'Obter Access Token de longa duração (60 dias)',
      'Conectar Instagram Business Account (conta comercial obrigatória)',
      'Configurar webhook para receber notificações em tempo real',
    ],
    status: 'available',
    pricing: 'Gratuito (até 200 chamadas/hora)',
    premium: [
      'Stories publishing',
      'Reels publishing',
      'Shopping tags',
      'Branded content tools',
    ],
  },
  {
    platform: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    bgColor: '#DBEAFE',
    icon: 'facebook',
    apiName: 'Facebook Graph API',
    apiDocsUrl: 'https://developers.facebook.com/docs/graph-api',
    authType: 'oauth2',
    capabilities: {
      posting: true,
      analytics: true,
      mentions: true,
      stories: false,
      reels: true,
      scheduling: true,
      insights: true,
      directMessage: true,
    },
    requirements: {
      apiKey: 'App ID do Meta',
      apiSecret: 'App Secret do Meta',
      accessToken: 'Page Access Token',
      businessAccountId: 'Facebook Page ID',
      webhookUrl: true,
      appReview: true,
    },
    rateLimits: '200 chamadas/hora por usuário',
    scopes: [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
      'pages_messaging',
      'pages_manage_metadata',
      'read_insights',
    ],
    setupSteps: [
      'Criar conta no Meta for Developers',
      'Criar App do tipo "Business"',
      'Adicionar produto Facebook Login',
      'Configurar URLs de redirecionamento OAuth',
      'Solicitar App Review para permissões públicas',
      'Obter Page Access Token (token da página, não do usuário)',
      'Configurar webhook para receber webhooks de páginas',
      'Habilitar mensagens via Messenger Platform',
    ],
    status: 'available',
    pricing: 'Gratuito (até 200 chamadas/hora)',
    premium: [
      'Page Insights avançadas',
      'Messenger API',
      'Lead Generation Ads',
      'Custom Audiences',
    ],
  },
  {
    platform: 'linkedin',
    label: 'LinkedIn',
    color: '#0A66C2',
    bgColor: '#DBEAFE',
    icon: 'linkedin',
    apiName: 'LinkedIn Marketing API',
    apiDocsUrl: 'https://docs.microsoft.com/linkedin/marketing',
    authType: 'oauth2',
    capabilities: {
      posting: true,
      analytics: true,
      mentions: false,
      stories: false,
      reels: false,
      scheduling: true,
      insights: true,
      directMessage: false,
    },
    requirements: {
      apiKey: 'Client ID',
      apiSecret: 'Client Secret',
      accessToken: 'Access Token OAuth2',
      businessAccountId: 'Organization ID (Company Page)',
      appReview: true,
    },
    rateLimits: '100.000 chamadas/dia',
    scopes: [
      'w_member_social',
      'rw_organization_admin',
      'w_organization_social',
      'r_organization_social',
      'r_organization_followers',
      'rw_ads',
      'r_ads_reporting',
    ],
    setupSteps: [
      'Criar conta no LinkedIn Developers (developer.linkedin.com)',
      'Criar um App',
      'Adicionar produto "Share on LinkedIn" e "Marketing Developer Platform"',
      'Configurar URL de redirecionamento OAuth2',
      'Verificar a Company Page (Domain Verification)',
      'Solicitar acesso à Marketing API (pode levar até 7 dias)',
      'Obter Access Token com organization scopes',
      'Associar a Company Page ao app',
    ],
    status: 'available',
    pricing: 'Gratuito (requer aprovação)',
    premium: [
      'Page Analytics',
      'Lead Gen Forms',
      'Audience Network',
      'Dynamic Ads',
    ],
  },
  {
    platform: 'twitter',
    label: 'Twitter / X',
    color: '#000000',
    bgColor: '#F3F4F6',
    icon: 'twitter',
    apiName: 'Twitter API v2',
    apiDocsUrl: 'https://developer.twitter.com/en/docs/twitter-api',
    authType: 'oauth2',
    capabilities: {
      posting: true,
      analytics: true,
      mentions: true,
      stories: false,
      reels: false,
      scheduling: false,
      insights: true,
      directMessage: true,
    },
    requirements: {
      apiKey: 'API Key',
      apiSecret: 'API Key Secret',
      accessToken: 'OAuth 2.0 Access Token',
      appReview: true,
    },
    rateLimits: '17.000 tweets/mês (Basic $100/mês) | 500.000 (Pro $5000/mês)',
    scopes: [
      'tweet.read',
      'tweet.write',
      'users.read',
      'follows.read',
      'follows.write',
      'dm.read',
      'dm.write',
    ],
    setupSteps: [
      'Criar conta no Twitter Developer Portal (developer.twitter.com)',
      'Escolher plano: Free (apenas leitura), Basic ($100/mês) ou Pro ($5000/mês)',
      'Criar um App e gerar API Keys',
      'Configurar OAuth 2.0 com PKCE',
      'Solicitar elevated access para posting',
      'Configurar webhook para menções em tempo real',
    ],
    status: 'available',
    pricing: 'Basic: $100/mês | Pro: $5000/mês | Free: apenas leitura',
    premium: [
      'Auto-post (Basic+)',
      'Analytics avançadas (Pro)',
      'Filtered stream',
      'Batch compliance',
    ],
  },
  {
    platform: 'tiktok',
    label: 'TikTok',
    color: '#000000',
    bgColor: '#F3F4F6',
    icon: 'tiktok',
    apiName: 'TikTok Business API',
    apiDocsUrl: 'https://developers.tiktok.com/doc/business-api',
    authType: 'oauth2',
    capabilities: {
      posting: true,
      analytics: true,
      mentions: true,
      stories: false,
      reels: true,
      scheduling: true,
      insights: true,
      directMessage: false,
    },
    requirements: {
      apiKey: 'App ID',
      apiSecret: 'App Secret',
      accessToken: 'Access Token',
      businessAccountId: 'Business Account ID',
      appReview: true,
    },
    rateLimits: 'Limites por endpoint (ver docs)',
    scopes: [
      'video.publish',
      'video.list',
      'user.info.basic',
      'analytics.read',
    ],
    setupSteps: [
      'Criar conta no TikTok for Developers (developers.tiktok.com)',
      'Criar um App Business',
      'Configurar OAuth 2.0',
      'Solicitar acesso à Content Posting API',
      'Obter Access Token',
      'Configurar webhook (opcional)',
    ],
    status: 'beta',
    pricing: 'Gratuito (requer conta Business)',
    premium: [
      'Direct posting',
      'Video analytics',
      'Sound library',
      'Branded effects',
    ],
  },
  {
    platform: 'youtube',
    label: 'YouTube',
    color: '#FF0000',
    bgColor: '#FEE2E2',
    icon: 'youtube',
    apiName: 'YouTube Data API v3',
    apiDocsUrl: 'https://developers.google.com/youtube/v3',
    authType: 'oauth2',
    capabilities: {
      posting: true,
      analytics: true,
      mentions: false,
      stories: false,
      reels: false,
      scheduling: true,
      insights: true,
      directMessage: false,
    },
    requirements: {
      apiKey: 'Google API Key',
      accessToken: 'OAuth 2.0 Token',
      appReview: true,
    },
    rateLimits: '10.000 unidades/dia (gratuito)',
    scopes: [
      'youtube.upload',
      'youtube.readonly',
      'yt-analytics.readonly',
      'yt-analytics-monetary.readonly',
    ],
    setupSteps: [
      'Criar projeto no Google Cloud Console (console.cloud.google.com)',
      'Habilitar YouTube Data API v3',
      'Habilitar YouTube Analytics API',
      'Criar credenciais OAuth 2.0',
      'Configurar telas de consentimento',
      'Solicitar verificação (para escopos sensíveis)',
      'Obter Access Token via OAuth flow',
    ],
    status: 'available',
    pricing: 'Gratuito (10.000 unidades/dia)',
    premium: [
      'Video upload',
      'Analytics avançadas',
      'Channel insights',
      'Comment moderation',
    ],
  },
  {
    platform: 'google_my_business',
    label: 'Google Meu Negócio',
    color: '#4285F4',
    bgColor: '#DBEAFE',
    icon: 'map',
    apiName: 'Google Business Profile API',
    apiDocsUrl: 'https://developers.google.com/my-business',
    authType: 'oauth2',
    capabilities: {
      posting: true,
      analytics: true,
      mentions: true,
      stories: false,
      reels: false,
      scheduling: true,
      insights: true,
      directMessage: false,
    },
    requirements: {
      apiKey: 'Google API Key',
      accessToken: 'OAuth 2.0 Token',
      businessAccountId: 'Business Account ID',
      appReview: true,
    },
    rateLimits: 'Definido por projeto no Google Cloud',
    scopes: [
      'business.manage',
      'business.performance',
      'business.communications',
    ],
    setupSteps: [
      'Criar projeto no Google Cloud Console',
      'Habilitar Google Business Profile API',
      'Criar credenciais OAuth 2.0',
      'Solicitar acesso à API (requer aprovação do Google)',
      'Verificar propriedade do negócio no Google Meu Negócio',
      'Obter Access Token',
    ],
    status: 'available',
    pricing: 'Gratuito',
    premium: [
      'Local posts',
      'Review management',
      'Business insights',
      'Q&A management',
    ],
  },
  {
    platform: 'google_analytics',
    label: 'Google Analytics',
    color: '#E37400',
    bgColor: '#FEF3C7',
    icon: 'chart',
    apiName: 'Google Analytics Data API',
    apiDocsUrl: 'https://developers.google.com/analytics/devguides/reporting/data/v1',
    authType: 'oauth2',
    capabilities: {
      posting: false,
      analytics: true,
      mentions: false,
      stories: false,
      reels: false,
      scheduling: false,
      insights: true,
      directMessage: false,
    },
    requirements: {
      apiKey: 'Google API Key',
      accessToken: 'OAuth 2.0 Token',
      businessAccountId: 'GA4 Property ID',
    },
    rateLimits: '50.000 requisições/dia',
    scopes: [
      'analytics.readonly',
      'analytics.reporting',
    ],
    setupSteps: [
      'Criar projeto no Google Cloud Console',
      'Habilitar Google Analytics Data API v1',
      'Criar credenciais OAuth 2.0',
      'Obter GA4 Property ID',
      'Autorizar acesso via OAuth',
    ],
    status: 'available',
    pricing: 'Gratuito',
    premium: [
      'Web traffic analysis',
      'Conversion tracking',
      'Audience insights',
      'Custom reports',
    ],
  },
]

export function getIntegrationByPlatform(platform: string): PlatformIntegration | undefined {
  return PLATFORM_INTEGRATIONS.find((p) => p.platform === platform)
}

export const CAPABILITY_LABELS: Record<string, string> = {
  posting: 'Publicação',
  analytics: 'Analytics',
  mentions: 'Menções',
  stories: 'Stories',
  reels: 'Reels',
  scheduling: 'Agendamento',
  insights: 'Insights',
  directMessage: 'DM',
}
