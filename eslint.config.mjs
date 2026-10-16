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
    "out/**",
    "build/**",
    "dist-cloudflare/**",
    "dist-netlify/**",
    "dist/**",
    "vendor/**",
    "next-env.d.ts",
  ]),
  {
    // Production is a Vite/React application. Next's router rule is incompatible
    // with Pages' own file routes; native links are required here.
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      // Existing API/JSON contracts and asynchronous mount effects remain visible
      // as migration warnings. TypeScript and all other correctness rules block CI.
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },

]);

export default eslintConfig;
