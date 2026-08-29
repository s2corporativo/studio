# Quality gates

The Studio release validation should distinguish application type checking, test type checking, formatting, executable tests, build and migration validation.

Recommended read-only commands:

```bash
pnpm check
pnpm check:tests
pnpm format:check
pnpm test
pnpm build
node scripts/validate-migrations.mjs
```

`pnpm check:tests` exists because the primary `tsconfig.json` intentionally excludes `*.test.ts`; Vitest transpilation alone is not a substitute for static contract checking of mocks and test helpers.

`pnpm format:check` never rewrites source files and is appropriate for CI. `pnpm format` remains the explicit developer command that writes formatting changes.

Do not add these gates to required CI until the existing repository passes them in an executable runner. If a new gate exposes pre-existing debt, fix that debt in a separate reviewed change instead of weakening the gate.
