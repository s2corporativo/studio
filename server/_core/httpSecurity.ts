import type { ErrorRequestHandler, Express } from "express";

export function registerHttpSecurity(app: Express) {
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    if (req.path.startsWith("/api/oauth/") || req.path.startsWith("/api/instagram/oauth/")) {
      res.setHeader("Cache-Control", "no-store");
    }
    next();
  });
}

export function registerHttpErrorHandler(app: Express) {
  const handler: ErrorRequestHandler = (error, _req, res, next) => {
    const candidate = error as { status?: number; type?: string };
    if (candidate.status === 413 || candidate.type === "entity.too.large") {
      res.status(413).json({ error: "request-too-large" });
      return;
    }
    if (candidate.status === 400 && error instanceof SyntaxError) {
      res.status(400).json({ error: "invalid-json" });
      return;
    }
    next(error);
  };
  app.use(handler);
}
