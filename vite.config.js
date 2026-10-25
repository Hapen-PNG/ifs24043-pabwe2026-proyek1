import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function deferStylesheets() {
  return {
    name: "defer-stylesheets",
    enforce: "post",
    generateBundle(_options, bundle) {
      const htmlAsset = bundle["index.html"];
      if (!htmlAsset || htmlAsset.type !== "asset") return;

      const html = String(htmlAsset.source);
      const stylesheetPattern = /<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="([^"]+\.css)")([^>]*)>/g;
      let stylesheetCount = 0;
      const updatedHtml = html.replace(stylesheetPattern, (_tag, href) => {
        stylesheetCount += 1;
        return `<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${href}"></noscript>`;
      });

      if (stylesheetCount === 0) {
        throw new Error("Tidak ditemukan stylesheet produksi untuk dibuat non-blocking.");
      }
      htmlAsset.source = updatedHtml;
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // load .env sesuai mode (development/production)
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), deferStylesheets()],
    build: {
      outDir: "public_html", // folder hasil build
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) {
              return "react-vendor";
            }
            if (/\/node_modules\/(react-router|react-router-dom)\//.test(id)) {
              return "router-vendor";
            }
            if (/\/node_modules\/(@reduxjs|react-redux|redux|immer|reselect)\//.test(id)) {
              return "state-vendor";
            }
            if (id.includes("/node_modules/sweetalert2/")) {
              return "sweetalert-vendor";
            }
            return undefined;
          },
        },
      },
    },
    define: {
      DELCOM_BASEURL: JSON.stringify(env.VITE_DELCOM_BASEURL || ""),
      API_BASEURL: JSON.stringify(env.VITE_API_BASEURL || ""),
    },
  };
});
