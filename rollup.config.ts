import typescript from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts';
import commonjs from '@rollup/plugin-commonjs';
import externals from 'rollup-plugin-node-externals';
import shebang from 'rollup-plugin-preserve-shebang';

import pkg from './package.json';

export default [
  // Основная библиотека
  {
    input: './src/index.ts',
    output: [
      { file: pkg.main, name: pkg.name, format: 'umd', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true },
    ],
    plugins: [externals(), commonjs(), typescript({ useTsconfigDeclarationDir: true })],
  },

  // Типы
  {
    input: ['./src/index.ts'],
    output: [
      {
        format: 'esm',
        file: pkg.typings,
      },
    ],
    plugins: [dts()],
  },

  // CLI скрипты
  {
    input: {
      'cli/pwa/createPWA': './src/cli/pwa/createPWA.ts',
      'cli/serviceWorker/createServiceWorker': './src/cli/serviceWorker/createServiceWorker.ts'
    },
    output: {
      dir: 'dist',
      format: 'cjs',
      entryFileNames: '[name].js',
      banner: '#!/usr/bin/env node'
    },
    plugins: [
      shebang(),
      externals(),
      commonjs(),
      typescript({
        useTsconfigDeclarationDir: true,
        tsconfigOverride: {
          compilerOptions: {
            module: "ESNext"
          }
        }
      })
    ],
  },

  // Копирование шаблонов в dist
  {
    input: 'src/cli/templates/dummy.js',
    output: {
      dir: 'dist/cli/templates'
    },
    // Плагин для копирования шаблонов
    plugins: [
      {
        name: 'copy-templates',
        generateBundle() {
          // Этот хук вызывается перед записью файлов
          // Здесь можно использовать fs для копирования шаблонов
          require('fs').cpSync('src/cli/templates', 'dist/cli/templates', { recursive: true });
        }
      }
    ]
  },
];
