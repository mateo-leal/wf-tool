import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/lib/constants.ts',
    'src/server.ts',
    'src/lib/locales.ts',
    'src/types/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  minify: true,
})
