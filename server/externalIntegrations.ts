import type { InstagramConnection } from "../drizzle/schema";

export const externalIntegrationIds = [
  "instagram",
  "facebook",
  "linkedin",
  "tiktok",
  "youtube",
  "google_business",
  "meta_ads",
  "google_ads",
] as const;

export type ExternalIntegrationId = (typeof externalIntegrationIds)[number];
export type ExternalIntegrationState = "connected" | "ready_for_oauth" | "awaiting_credentials" | "connector_planned" | "error";

export type ExternalIntegrationStatus = {
  id: ExternalIntegrationId;
  label: string;
  category: "social" | "local" | "ads";
  state: ExternalIntegrationState;
  detail: string;
  configured: boolean;
  connected: boolean;
  missingConfiguration: string[];
  capabilities: {
    referenceProfile: boolean;
    oauth: boolean;
    publish: boolean;
    schedule: boolean;
    analytics: boolean;
    ads: boolean;
  };
};

export type ExternalIntegrationConfig = {
  metaInstagramAppId?: string;
  metaInstagramAppSecret?: string;
  metaFacebookAppId?: string;
  metaFacebookAppSecret?: string;
  linkedinClientId?: string;
  linkedinClientSecret?: string;
  tiktokClientKey?: string;
  tiktokClientSecret?: string;
  googleOAuthClientId?: string;
  googleOAuthClientSecret?: string;
  metaAdsAppId?: string;
  metaAdsAppSecret?: string;
};

const definitions: Record<ExternalIntegrationId, Omit<ExternalIntegrationStatus, "state" | "configured" | "connected" | "missingConfiguration"> & { required: Array<keyof ExternalIntegrationConfig>; implemented: boolean }> = {
  instagram: {
    id: "instagram",
    label: "Instagram",
    category: "social",
    detail: "OAuth oficial, teste não público, confirmação humana, publicação e agendamento já implementados.",
    required: ["metaInstagramAppId", "metaInstagramAppSecret"],
    implemented: true,
    capabilities: { referenceProfile: true, oauth: true, publish: true, schedule: true, analytics: false, ads: false },
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    category: "social",
    detail: "Perfil público pode ser cadastrado; OAuth e publicação oficial ainda aguardam conector Meta dedicado.",
    required: ["metaFacebookAppId", "metaFacebookAppSecret"],
    implemented: false,
    capabilities: { referenceProfile: true, oauth: false, publish: false, schedule: false, analytics: false, ads: false },
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    category: "social",
    detail: "Perfil público pode ser cadastrado; OAuth e publicação empresarial ainda aguardam conector oficial.",
    required: ["linkedinClientId", "linkedinClientSecret"],
    implemented: false,
    capabilities: { referenceProfile: true, oauth: false, publish: false, schedule: false, analytics: false, ads: false },
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    category: "social",
    detail: "Perfil público pode ser cadastrado; OAuth, upload e publicação de vídeo ainda aguardam conector oficial.",
    required: ["tiktokClientKey", "tiktokClientSecret"],
    implemented: false,
    capabilities: { referenceProfile: true, oauth: false, publish: false, schedule: false, analytics: false, ads: false },
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    category: "social",
    detail: "Canal público pode ser cadastrado; OAuth e publicação ainda aguardam conector Google oficial.",
    required: ["googleOAuthClientId", "googleOAuthClientSecret"],
    implemented: false,
    capabilities: { referenceProfile: true, oauth: false, publish: false, schedule: false, analytics: false, ads: false },
  },
  google_business: {
    id: "google_business",
    label: "Google Business Profile",
    category: "local",
    detail: "SEO Local está disponível; gestão oficial do perfil aguarda OAuth e permissões Google Business Profile.",
    required: ["googleOAuthClientId", "googleOAuthClientSecret"],
    implemented: false,
    capabilities: { referenceProfile: false, oauth: false, publish: false, schedule: false, analytics: false, ads: false },
  },
  meta_ads: {
    id: "meta_ads",
    label: "Meta Ads",
    category: "ads",
    detail: "Ads Intelligence planeja campanhas, mas criação, publicação e orçamento permanecem deliberadamente bloqueados.",
    required: ["metaAdsAppId", "metaAdsAppSecret"],
    implemented: false,
    capabilities: { referenceProfile: false, oauth: false, publish: false, schedule: false, analytics: false, ads: false },
  },
  google_ads: {
    id: "google_ads",
    label: "Google Ads",
    category: "ads",
    detail: "Ads Intelligence planeja campanhas, mas operação oficial aguarda credenciais Google e autorização humana de gasto.",
    required: ["googleOAuthClientId", "googleOAuthClientSecret"],
    implemented: false,
    capabilities: { referenceProfile: false, oauth: false, publish: false, schedule: false, analytics: false, ads: false },
  },
};

const envNames: Record<keyof ExternalIntegrationConfig, string> = {
  metaInstagramAppId: "META_INSTAGRAM_APP_ID",
  metaInstagramAppSecret: "META_INSTAGRAM_APP_SECRET",
  metaFacebookAppId: "META_FACEBOOK_APP_ID",
  metaFacebookAppSecret: "META_FACEBOOK_APP_SECRET",
  linkedinClientId: "LINKEDIN_CLIENT_ID",
  linkedinClientSecret: "LINKEDIN_CLIENT_SECRET",
  tiktokClientKey: "TIKTOK_CLIENT_KEY",
  tiktokClientSecret: "TIKTOK_CLIENT_SECRET",
  googleOAuthClientId: "GOOGLE_OAUTH_CLIENT_ID",
  googleOAuthClientSecret: "GOOGLE_OAUTH_CLIENT_SECRET",
  metaAdsAppId: "META_ADS_APP_ID",
  metaAdsAppSecret: "META_ADS_APP_SECRET",
};

export function getExternalIntegrationConfigFromEnv(): ExternalIntegrationConfig {
  return {
    metaInstagramAppId: process.env.META_INSTAGRAM_APP_ID,
    metaInstagramAppSecret: process.env.META_INSTAGRAM_APP_SECRET,
    metaFacebookAppId: process.env.META_FACEBOOK_APP_ID,
    metaFacebookAppSecret: process.env.META_FACEBOOK_APP_SECRET,
    linkedinClientId: process.env.LINKEDIN_CLIENT_ID,
    linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    tiktokClientKey: process.env.TIKTOK_CLIENT_KEY,
    tiktokClientSecret: process.env.TIKTOK_CLIENT_SECRET,
    googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    metaAdsAppId: process.env.META_ADS_APP_ID,
    metaAdsAppSecret: process.env.META_ADS_APP_SECRET,
  };
}

function isPresent(value?: string) {
  return Boolean(value?.trim());
}

export function buildExternalIntegrationStatuses(config: ExternalIntegrationConfig, instagramConnection?: Pick<InstagramConnection, "state" | "lastError"> | null): ExternalIntegrationStatus[] {
  return externalIntegrationIds.map(id => {
    const definition = definitions[id];
    const missingConfiguration = definition.required.filter(key => !isPresent(config[key])).map(key => envNames[key]);
    const configured = missingConfiguration.length === 0;

    if (id === "instagram") {
      if (instagramConnection?.state === "connected") {
        return { ...definition, configured, connected: true, missingConfiguration, state: "connected" as const };
      }
      if (instagramConnection?.state === "error") {
        return { ...definition, configured, connected: false, missingConfiguration, state: "error" as const, detail: "A conexão oficial do Instagram está em erro. Revise as credenciais/OAuth antes de tentar publicar." };
      }
      return {
        ...definition,
        configured,
        connected: false,
        missingConfiguration,
        state: configured ? "ready_for_oauth" as const : "awaiting_credentials" as const,
      };
    }

    return {
      ...definition,
      configured,
      connected: false,
      missingConfiguration,
      state: configured && definition.implemented ? "ready_for_oauth" as const : configured ? "connector_planned" as const : "awaiting_credentials" as const,
    };
  });
}
