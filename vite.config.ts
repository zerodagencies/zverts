import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
    server: {
        host: "localhost",
    },
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
        dedupe: [
            "react",
            "react-dom",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "@tanstack/react-query",
            "@tanstack/query-core",
        ],
    },
    build: {
        target: "es2020",
        cssCodeSplit: true,
        minify: "esbuild",
        reportCompressedSize: false,
        chunkSizeWarningLimit: 1600,
    },
});
