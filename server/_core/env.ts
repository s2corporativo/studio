export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  preferredLlmModel: process.env.LLM_MODEL ?? "gpt-5-mini",
  metaInstagramAppId: process.env.META_INSTAGRAM_APP_ID ?? "",
  metaInstagramAppSecret: process.env.META_INSTAGRAM_APP_SECRET ?? "",
};
