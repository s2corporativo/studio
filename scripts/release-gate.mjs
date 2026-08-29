import { spawnSync } from "node:child_process";

const steps = [
  { label: "TypeScript", command: "pnpm", args: ["check"] },
  { label: "Testes", command: "pnpm", args: ["test"] },
  { label: "Build", command: "pnpm", args: ["build"] },
  { label: "Migrations", command: "node", args: ["scripts/validate-migrations.mjs"] },
];

for (const step of steps) {
  console.log(`\n[release-gate] ${step.label}...`);
  const result = spawnSync(step.command, step.args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.error) {
    console.error(`[release-gate] Não foi possível iniciar ${step.label}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[release-gate] ${step.label} falhou com código ${result.status ?? "desconhecido"}. Release bloqueado.`);
    process.exit(result.status ?? 1);
  }
}

console.log("\n[release-gate] Aprovado: TypeScript, testes, build e migrations passaram.");
