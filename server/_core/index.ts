import "dotenv/config";
import express from "express";
import { randomUUID } from "node:crypto";
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

const GLOBAL_BODY_LIMIT = "10mb";
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,100}$/;

type RequestWithId = express.Request & { requestId?: string };

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
  const app = express();
  const server = createServer(app);

  app.disable("x-powered-by");
  app.use((req, res, next) => {
    const incomingRequestId = req.header("x-request-id")?.trim();
    const requestId = incomingRequestId && REQUEST_ID_PATTERN.test(incomingRequestId)
      ? incomingRequestId
      : randomUUID();
    (req as RequestWithId).requestId = requestId;
    res.setHeader("X-Request-ID", requestId);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
  });

  app.use(express.json({ limit: GLOBAL_BODY_LIMIT }));
  app.use(express.urlencoded({ limit: GLOBAL_BODY_LIMIT, extended: true }));
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
      onError({ error, path, type, ctx, req }) {
        const requestId = (req as RequestWithId).requestId ?? null;
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          event: "trpc.error",
          requestId,
          path: path ?? null,
          procedureType: type,
          errorCode: error.code,
          userId: ctx?.user?.id ?? null,
        }));
      },
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
