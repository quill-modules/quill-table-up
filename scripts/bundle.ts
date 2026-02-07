#!/usr/bin/env node
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { babel } from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import autoprefixer from 'autoprefixer';
import gulp from 'gulp';
import cleanCSS from 'gulp-clean-css';
import less from 'gulp-less';
import postcss from 'gulp-postcss';
import pxtorem from 'postcss-pxtorem';
import { build } from 'tsdown';
import { demoBundle, distBundle, projectRoot } from './constants';

const { dest, src, watch } = gulp;

const baseOptions = {
  cwd: projectRoot,
  entry: ['./src/index.ts'],
  dts: true,
  plugins: [],
  ignoreWatch: ['./src/__tests__', './src/style'],
  external: ['quill'],
  noExternal: ['@floating-ui/dom'],
  inlineOnly: ['@floating-ui/utils', '@floating-ui/core', '@floating-ui/dom'],
  loader: {
    '.svg': 'text',
  } as const,
  sourcemap: true,
  minify: false,
  clean: false,
  watch: false,
};

export function buildStyle({
  isDev = false,
  onSuccess = () => {},
} = {}) {
  function buildLess() {
    return src(['./src/style/index.less', './src/style/table-creator.less'])
      .pipe(less())
      .pipe(
        postcss([
          autoprefixer(),
          pxtorem({
            rootValue: 16,
            propList: ['*'],
            selectorBlackList: ['.ql-'],
          }),
        ]),
      )
      .pipe(
        cleanCSS({}, (details) => {
          console.log(
            `${details.name}: ${details.stats.originalSize / 1000} KB -> ${
              details.stats.minifiedSize / 1000
            } KB`,
          );
        }),
      )
      .pipe(dest(distBundle))
      .pipe(dest(demoBundle))
      .on('finish', () => {
        onSuccess();
      });
  }
  if (isDev) {
    watch('./src/**/*.less', buildLess);
  }
  return buildLess();
}

export async function buildTS({
  isDev = false,
  onSuccess = () => {},
} = {}) {
  const options = {
    ...baseOptions,
    minify: !isDev,
    watch: isDev ? ['./src'] : false,
  };
  return Promise.all([
    isDev
      ? null
      : build({
          ...options,
          format: ['esm'],
          outExtensions: () => ({ js: '.js' }),
        }),
    build(
      {
        ...options,
        format: ['umd'],
        platform: 'browser',
        target: ['es2015'],
        inputOptions: {
          plugins: [
            ...options.plugins || [],
            ...isDev
              ? []
              : [
                  // use `plugin-typescript` make babel work
                  typescript({ tsconfig: './tsconfig.json', exclude: ['src/__tests__/**/*'] }),
                  babel({
                    babelHelpers: 'bundled',
                    presets: [
                      [
                        '@babel/preset-env',
                        {
                          targets: {
                            browsers: ['> 0.25%', 'last 2 versions'],
                          },
                          modules: false,
                        },
                      ],
                    ],
                    exclude: 'node_modules/**',
                    extensions: ['.js', '.ts'],
                  }),
                ],
          ],
        },
        outputOptions: {
          name: 'TableUp',
          format: 'umd',
          globals: {
            quill: 'Quill',
          },
          exports: 'named',
          plugins: [],
        },
        onSuccess() {
          copyFileSync(resolve(distBundle, 'index.umd.js'), resolve(demoBundle, 'index.umd.js'));
          copyFileSync(resolve(distBundle, 'index.umd.js.map'), resolve(demoBundle, 'index.umd.js.map'));
          console.log(`Copied index.umd.js to demo bundle`);
          onSuccess();
        },
      },
    ),
  ]);
}
