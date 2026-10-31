import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Les pages chargent leurs données avec fetch() dans un useEffect, qui passe
      // loading à true avant le premier await : signalé, mais sans bug réel.
      // À repasser en erreur après migration vers SWR ou les Server Components.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Client Prisma généré par `prisma generate` (postinstall)
    "app/generated/**",
    // Site de documentation Docusaurus, projet séparé
    "website/**",
  ]),
]);

export default eslintConfig;
