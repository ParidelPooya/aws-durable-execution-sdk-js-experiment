import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    target: "esnext",
  },
  define: {
    "process.env": {},
    "process.platform": '"browser"',
    "process.version": '"v18.0.0"',
    global: "globalThis",
    setImmediate: "(fn, ...args) => setTimeout(fn, 0, ...args)",
    clearImmediate: "clearTimeout",
    __dirname: '"/browser"',
    __filename: '"/browser/index.js"',
  },
  resolve: {
    alias: {
      "node:console": path.resolve(__dirname, "src/console-polyfill.ts"),
      "node:util": path.resolve(__dirname, "src/util-polyfill.ts"),
      "node:crypto": path.resolve(__dirname, "src/crypto-polyfill.ts"),
      "node:worker_threads": path.resolve(
        __dirname,
        "src/worker-threads-polyfill.ts",
      ),
      "node:fs/promises": path.resolve(
        __dirname,
        "src/fs-promises-polyfill.ts",
      ),
      "node:path": path.resolve(__dirname, "src/path-polyfill.ts"),
      crypto: path.resolve(__dirname, "src/crypto-polyfill.ts"),
      async_hooks: path.resolve(__dirname, "src/async-hooks-polyfill.ts"),
    },
  },
  optimizeDeps: {
    include: ["@aws/durable-execution-sdk-js"],
  },
});
