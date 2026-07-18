import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig(async () => {
  const plugins = [
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ];

  if (process.env.NETLIFY) {
    const { netlifyPlugin } = await import("@netlify/vite-plugin-tanstack-start");
    plugins.push(netlifyPlugin());
  }

  return {
    plugins,
  };
});

