import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

try {
  process.loadEnvFile?.();
} catch {
  // Vercel injects environment variables natively without .env
}

function blackwhiteBackendPlugin(): Plugin {
  return {
    name: "blackwhite-backend-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const mod = await server.ssrLoadModule("/server/app.ts");
          const handled = await mod.handleApiRequest(req, res);
          if (!handled) next();
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

const rootDir = path.resolve(__dirname);

export default defineConfig({
  plugins: [react(), tailwindcss(), blackwhiteBackendPlugin()],
  resolve: {
    alias: {
      "@": rootDir,
      "next/link": path.resolve(rootDir, "src/shims/next-link.tsx"),
      "next/navigation": path.resolve(rootDir, "src/shims/next-navigation.ts"),
      "next-auth/react": path.resolve(rootDir, "src/lib/auth-client.tsx"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});

