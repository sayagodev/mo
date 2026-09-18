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
      // The published package ships ./js/* (not ./src/js/*), so generated
      // type imports must resolve from the consumer's node_modules root.
      componentTypePath: (name, tagName, modulePath) =>
        `@sayagodev/mo/${modulePath.replace(/^src\//, '')}`,
    }),
  ],
}
