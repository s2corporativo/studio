import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerInstagramOAuthRoutes } from "../instagramOAuth";
import { runInstagramPublicationSchedule } from "../instagramSchedule";
import { registerStorageProxy } from "./storageProxy";
import { registerHealthRoutes } from "./health";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // STU-09: segredo de sessão obrigatório em produção (fail-closed).
  // Sem isso, tokens eram assinados/verificados com HMAC de chave vazia.
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET é obrigatório em produção — abortando boot (fail-closed)"
    );
  }

  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerHealthRoutes(app);
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerInstagramOAuthRoutes(app);
  app.post("/api/scheduled/instagram-publication", runInstagramPublicationSchedule);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  // STU-05: em produção NÃO desloca porta silenciosamente — falha honesta.
  if (process.env.NODE_ENV === "production") {
    if (!(await isPortAvailable(preferredPort))) {
      throw new Error(
        `Porta ${preferredPort} ocupada — abortando boot de produção (fail-fast)`
      );
    }
    server.listen(preferredPort, () => {
      console.log(`Server running on http://localhost:${preferredPort}/`);
    });
  } else {
    const port = await findAvailablePort(preferredPort);

    if (port !== preferredPort) {
      console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
    }

    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}/`);
    });
  }
}

startServer().catch((err) => {
  console.error("Falha no boot:", err);
  process.exit(1);
});
