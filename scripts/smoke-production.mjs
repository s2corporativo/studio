const baseUrl = (process.env.BASE_URL || process.argv[2] || "").replace(/\/$/, "");
if (!baseUrl) {
  console.error("Uso: BASE_URL=https://seu-dominio pnpm smoke:production");
  process.exit(1);
}

const routes = [
  "/",
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

async function request(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": "depaula-social-os-smoke/1.0" },
    });
    return { path, status: response.status, ok: response.status >= 200 && response.status < 400 };
  } catch (error) {
    return { path, status: 0, ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

const health = await request("/api/health");
const ready = await request("/api/ready");
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

console.log("[smoke] domínio pronto: health, readiness e rotas principais responderam corretamente.");
