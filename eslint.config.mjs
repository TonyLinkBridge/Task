import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".worktrees/**",
    ".isolated/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Browser-delivered third-party reference bundles; integrity checked by test:marketing.
    "preview/murmura/site/**",
    "public/marketing-assets/motion.mjs",
  ]),
]);

export default eslintConfig;
