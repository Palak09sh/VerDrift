import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The browser talks to Vite (same origin), and Vite forwards /api and /health
// to the Express server. That avoids CORS entirely during development.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:3000",
      "/health": "http://127.0.0.1:3000",
    },
  },
});
