import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://splatter.fi",
  output: "static",
  build: {
    assets: "assets",
  },
});
