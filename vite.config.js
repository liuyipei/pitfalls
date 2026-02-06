import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const normalizedBase = (() => {
  const rawBase = process.env.VITE_BASE_PATH ?? "/";
  if (!rawBase.startsWith("/")) return `/${rawBase}`;
  return rawBase;
})();

export default defineConfig({
  plugins: [react()],
  base: normalizedBase,
});
