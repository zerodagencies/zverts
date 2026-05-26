import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    minify: "esbuild",
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router")) return "router";
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("scheduler")) return "react-vendor";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("react-syntax-highlighter") || id.includes("refractor") || id.includes("prismjs")) return "syntax";
          if (id.includes("katex") || id.includes("rehype-katex") || id.includes("remark-math")) return "katex";
          if (id.includes("react-markdown") || id.includes("remark-") || id.includes("rehype-") || id.includes("mdast") || id.includes("micromark") || id.includes("hast")) return "markdown";
          if (id.includes("jspdf") || id.includes("canvg") || id.includes("html2canvas")) return "pdf";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("i18next") || id.includes("react-i18next")) return "i18n";
          if (id.includes("framer-motion") || id.includes("motion-")) return "motion";
          if (id.includes("embla-carousel")) return "embla";
          if (id.includes("date-fns")) return "date-fns";
        },
      },
    },
  },
}));
