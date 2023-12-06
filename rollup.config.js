/*
 * Copyright 2020-present columns.ai
 *
 * The code belongs to https://columns.ai
 * Terms & conditions to be found at `LICENSE.txt`.
 */

import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: {
    dir: './dist',
    format: 'cjs'
  },
  plugins: [
    typescript(),
    nodeResolve(),
  ]
};