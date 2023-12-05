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

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, './dist/lib/index.js'),
      name: 'nebula.js',
      fileName: 'index',
    },
  }
});