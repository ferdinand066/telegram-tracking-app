/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  serverExternalPackages: ["sharp", "tesseract.js"],
  // Next file tracing skips .wasm by default; Tesseract loads them at runtime on Node.
  outputFileTracingIncludes: {
    "/api/telegram/webhook": ["./node_modules/tesseract.js-core/**/*.wasm"],
  },
};

export default config;
