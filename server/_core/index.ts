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
import { registerCalendarExport } from "../calendarExport";
import { registerSocialHubRoutes } from "../socialhub/routes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import * as db from "../db";
import { sdk } from "./sdk";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME } from "../../shared/const";

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
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerHealthRoutes(app);
  registerStorageProxy(app);
  registerCalendarExport(app);
  registerSocialHubRoutes(app);
  // Serve uploaded files
  app.use("/uploads", express.static("uploads"));
  registerOAuthRoutes(app);
  registerInstagramOAuthRoutes(app);

  // Dev login: creates a user + session without external OAuth
  app.get("/api/dev-login", async (req, res) => {
    try {
      const openId = process.env.OWNER_OPEN_ID || "dev-user";
      await db.upsertUser({
        openId,
        name: "De Paula Admin",
        email: "admin@depaula.studio",
        loginMethod: "dev",
        lastSignedIn: new Date(),
        role: "admin",
      });
      const sessionToken = await sdk.createSessionToken(openId, {
        name: "De Paula Admin",
        expiresInMs: 365 * 24 * 60 * 60 * 1000,
      });
      const cookieOptions = getSessionCookieOptions(req);
      // Override for local dev: use Lax instead of None (None requires HTTPS)
      const isLocal = req.hostname === "localhost" || req.hostname === "127.0.0.1" || req.hostname.includes("localhost");
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: 365 * 24 * 60 * 60 * 1000,
        sameSite: isLocal ? "lax" : cookieOptions.sameSite,
        secure: isLocal ? false : cookieOptions.secure,
      });
      res.redirect(302, "/");
    } catch (error: any) {
      console.error("[DevLogin] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
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
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
