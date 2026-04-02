import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages is served at https://<user>.github.io/<repo>/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "serve" ? "/" : "/luna-app/",
}));
