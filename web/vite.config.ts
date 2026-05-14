import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-router-dom",
      "axios",
      "clsx",
      "tailwind-merge",
      "sonner",
      "recharts",
      "react-fast-marquee",
      "react-qr-code",
      "leaflet",
      "react-leaflet",
      "framer-motion",
      "cmdk",
      "@tanstack/react-query",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-progress",
      "@radix-ui/react-slot",
      "@radix-ui/react-tabs",
      "lucide-react",
      "class-variance-authority",
    ],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/q": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
