import { customElementVsCodePlugin } from 'custom-element-vs-code-integration';
import { jsxTypesPlugin } from '@wc-toolkit/jsx-types';

export default {
  globs: ['src/js/**/*.js'],
  exclude: ['src/js/base.js'],
  outdir: '.',
  plugins: [
    customElementVsCodePlugin({
      outdir: '.',
      htmlFileName: 'mo.html-data.json',
    }),
    jsxTypesPlugin({
      outdir: '.',
      fileName: 'mo.jsx.d.ts',
    }),
  ],
}
