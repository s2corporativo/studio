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

export function assertRuntimeConfiguration() {
  if (!ENV.isProduction) return;

  const missing = [
    ["VITE_APP_ID", ENV.appId],
    ["JWT_SECRET", ENV.cookieSecret],
    ["DATABASE_URL", ENV.databaseUrl],
    ["OAUTH_SERVER_URL", ENV.oAuthServerUrl],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) throw new Error(`Configuração obrigatória ausente: ${missing.join(", ")}.`);
  if (Buffer.byteLength(ENV.cookieSecret, "utf8") < 32) throw new Error("JWT_SECRET precisa ter pelo menos 32 bytes em produção.");
  if (!/^mysql(?:2)?:\/\//i.test(ENV.databaseUrl)) throw new Error("DATABASE_URL precisa usar o dialeto MySQL/TiDB.");

  let oauthUrl: URL;
  try {
    oauthUrl = new URL(ENV.oAuthServerUrl);
  } catch {
    throw new Error("OAUTH_SERVER_URL inválida.");
  }
  if (oauthUrl.protocol !== "https:") throw new Error("OAUTH_SERVER_URL precisa usar HTTPS em produção.");
}
