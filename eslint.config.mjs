import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['design/комплект_для_Александра_r6.9j/**', '.next/**', 'next-env.d.ts', 'screenshots/**', 'public/vendor/**', 'playwright-report/**', 'test-results/**']),
]);
