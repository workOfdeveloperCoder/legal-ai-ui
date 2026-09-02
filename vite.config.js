import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Proxy /api to legal-chatbot in local dev to avoid CORS.
// Set API_PROXY_TARGET in .env (not committed) — e.g. http://172.16.112.24:8000
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget =
    env.API_PROXY_TARGET || env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8001";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          timeout: 3_600_000,
          proxyTimeout: 3_600_000,
          // Keep SSE open while the local model thinks for minutes.
          configure: (proxy) => {
            proxy.on("proxyRes", (proxyRes) => {
              const ct = proxyRes.headers["content-type"] || "";
              if (String(ct).includes("text/event-stream")) {
                proxyRes.headers["cache-control"] = "no-cache, no-transform";
                proxyRes.headers["x-accel-buffering"] = "no";
                delete proxyRes.headers["content-length"];
              }
            });
          },
        },
      },
    },
  };
});
