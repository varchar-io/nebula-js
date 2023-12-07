/*
 * Copyright 2020-present columns.ai
 *
 * The code belongs to https://columns.ai
 * Terms & conditions to be found at `LICENSE.txt`.
 */

import {
  resolve
} from 'path';
import {
  defineConfig
} from 'vite';
import dts from 'vite-plugin-dts';

// TODO: we'll see if future vite version fixed the issue.
// very unfortunate, the vite built bundle file is not working well (unsure reason).
// just share the source as export for now.
export default defineConfig({
  build: {
    outDir: resolve(__dirname, './dist'),
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, './index.ts'),
      name: 'nebula',
      fileName: 'index',
      formats: ['cjs', 'es'],
    },
  },
  plugins: [dts({
    rollupTypes: true,
    rollupOptions: {
      input: resolve(__dirname, './index.ts'),
      output: {
        dir: resolve(__dirname, './dist'),
        entryFileNames: 'index.d.ts',
        format: 'es',
      },
    }
  })],
});