/// <reference types="vite/client" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_GITHUB_PAGES === "1" ? "/Expenses/" : "/",
});
