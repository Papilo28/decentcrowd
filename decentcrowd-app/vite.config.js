import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
    "process.env": {},
  },
  build: {
    target: "es2020",
  },
  esbuild: {
    target: "es2020",
  },
  optimizeDeps: {
    include: ["@reown/appkit", "@reown/appkit-adapter-ethers", "ethers"],
  },
});
