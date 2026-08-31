const baseUrl = (process.env.BASE_URL || process.argv[2] || "").replace(/\/$/, "");
if (!baseUrl) {
  console.error("Uso: BASE_URL=https://seu-dominio pnpm smoke:production");
  process.exit(1);
}

const routes = [
  "/",
  "/command-center",
  "/radar",
  "/conteudos",
  "/calendario",
  "/automacao",
  "/planejamento",
  "/biblioteca",
  "/fontes",
  "/conhecimento",
  "/redes",
  "/instagram",
  "/marca",
  "/roadmap",
];

async function request(path, expectJson = false) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": "depaula-social-os-smoke/2.0", accept: expectJson ? "application/json" : "text/html,*/*" },
    });
    const result = { path, status: response.status, ok: response.status >= 200 && response.status < 400, contentType: response.headers.get("content-type") ?? "" };
    if (expectJson) {
      if (!result.contentType.toLowerCase().includes("application/json")) return { ...result, ok: false, error: `esperado JSON, recebido ${result.contentType || "sem content-type"}` };
      try {
        return { ...result, json: await response.json() };
      } catch {
        return { ...result, ok: false, error: "corpo JSON inválido" };
      }
    }
    return result;
  } catch (error) {
    return { path, status: 0, ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

const health = await request("/api/health", true);
const ready = await request("/api/ready", true);
health.ok = Boolean(health.ok && health.json?.status === "ok" && health.json?.service === "depaula-social-os");
ready.ok = Boolean(ready.ok && ready.json?.status === "ready" && ready.json?.service === "depaula-social-os" && ready.json?.checks && Object.values(ready.json.checks).every(Boolean));

const ui = [];
for (const route of routes) ui.push(await request(route));

for (const result of [health, ready, ...ui]) {
  console.log(`${result.ok ? "OK" : "FAIL"} ${String(result.status).padStart(3, " ")} ${result.path}${result.error ? ` — ${result.error}` : ""}`);
}

const failedUi = ui.filter(result => !result.ok);
if (!health.ok || !ready.ok || failedUi.length > 0) {
  console.error(`[smoke] falhou: health=${health.ok}, ready=${ready.ok}, uiFailures=${failedUi.length}`);
  process.exit(1);
}

console.log("[smoke] domínio pronto: health/readiness JSON e rotas principais validados.");
