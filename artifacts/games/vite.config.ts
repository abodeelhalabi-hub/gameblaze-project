import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import type { IncomingMessage, ServerResponse } from "node:http";

const rawPort = process.env.PORT;
const port = rawPort && !Number.isNaN(Number(rawPort)) ? Number(rawPort) : 3000;

const basePath = process.env.BASE_PATH ?? "/";
const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://localhost:4000";

function sendJson(
  res: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>,
) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<
    string,
    unknown
  >;
}

function localApiPlugin(): Plugin {
  return {
    name: "gameblaze-local-api",
    configureServer(server) {
      server.middlewares.use("/api/admin/auth", async (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        try {
          const body = await readJsonBody(req);
          const password = typeof body.password === "string" ? body.password : "";
          const adminPassword = process.env.ADMIN_PASSWORD?.trim();
          const ok = adminPassword
            ? password === adminPassword
            : password.trim().length > 0;

          if (ok) {
            sendJson(res, 200, { ok: true });
            return;
          }

          sendJson(res, 401, {
            ok: false,
            error: "كلمة السر غير صحيحة",
          });
        } catch {
          sendJson(res, 400, { error: "تعذر قراءة طلب تسجيل الدخول" });
        }
      });

      server.middlewares.use("/api/games", (req, res) => {
        if (req.method === "GET" && (req.url === "/" || req.url === "")) {
          sendJson(res, 200, { games: [] });
          return;
        }

        sendJson(res, 503, {
          error:
            "API server is not running locally. Start the Express server to manage uploads and downloads.",
        });
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    ...(!apiProxyTarget ? [localApiPlugin()] : []),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
      ? [
        await import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer({
            root: path.resolve(import.meta.dirname, ".."),
          }),
        ),
        await import("@replit/vite-plugin-dev-banner").then((m) =>
          m.devBanner(),
        ),
      ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    ...(apiProxyTarget
      ? {
        proxy: {
          "/api": {
            target: apiProxyTarget,
            changeOrigin: true,
          },
        },
      }
      : {}),
    watch: {
      usePolling: true,
      interval: 100,
    },
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
