import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: replace "ai-camera-app" with your actual GitHub repo name.
// This makes asset paths resolve correctly on GitHub Pages
// (https://<user>.github.io/<repo-name>/).
export default defineConfig({
  plugins: [react()],
  base: "/ai-camera-app/",
});
