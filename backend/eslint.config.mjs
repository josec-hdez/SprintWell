// Encodes brief §14.1 layer dependency rules. Verify against docs/sprintwell-brief.md before relaxing.
//
// §14.1 (verbatim):
//   - Domain no importa de ninguna otra capa.
//   - Application depende solo de Domain.
//   - Infrastructure implementa interfaces de Domain y depende de Application/Domain hacia dentro.
//   - Presentation depende de Application.
//   - Composición: app.module.ts es el único sitio donde se cablea qué implementación concreta
//     de Infrastructure satisface qué interfaz de Domain.
//
// "root" element type = src/main.ts + src/app.module.ts (the composition root). It is the ONLY
// place allowed to import from all four layers simultaneously.

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import boundariesPlugin from 'eslint-plugin-boundaries';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '**/*.js', '**/*.mjs'],
  },
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      boundaries: boundariesPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      // Use the TypeScript resolver so `.js` import extensions (required by NodeNext) and
      // the `@domain/* @application/* @infrastructure/* @presentation/*` path aliases resolve
      // back to real source files — otherwise eslint-plugin-boundaries treats every import as
      // "unknown" and `boundaries/element-types` silently no-ops.
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
          alwaysTryTypes: true,
        },
        node: true,
      },
      'boundaries/include': ['src/**/*'],
      // `match: 'file'` is the v5 option name (legacy: `mode`). Each .ts file is its own
      // element so the plugin checks every cross-file import individually.
      'boundaries/elements': [
        { type: 'root', pattern: 'src/(main|app.module).ts', match: 'file' },
        { type: 'domain', pattern: 'src/domain/**/*', match: 'file' },
        { type: 'application', pattern: 'src/application/**/*', match: 'file' },
        { type: 'infrastructure', pattern: 'src/infrastructure/**/*', match: 'file' },
        { type: 'presentation', pattern: 'src/presentation/**/*', match: 'file' },
      ],
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',

      // §14.1 enforcement.
      // Note: same-layer imports (e.g. presentation/foo.ts → presentation/bar.ts) are allowed
      // because with `match: 'file'` every file is its own element, but layers are cohesive
      // units internally — wiring controllers to their module is normal.
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            // Domain → Domain only (self; nothing outside)
            { from: ['domain'], allow: ['domain'] },
            // Application → Domain + Application
            { from: ['application'], allow: ['domain', 'application'] },
            // Infrastructure → Domain + Application + Infrastructure
            { from: ['infrastructure'], allow: ['domain', 'application', 'infrastructure'] },
            // Presentation → Application + Presentation (brief §14.1: presentation depends on application)
            { from: ['presentation'], allow: ['application', 'presentation'] },
            // Composition root → any layer (the ONLY place wiring all four is allowed)
            {
              from: ['root'],
              allow: ['root', 'domain', 'application', 'infrastructure', 'presentation'],
            },
          ],
        },
      ],
      'boundaries/no-unknown': 'off',
      'boundaries/no-unknown-files': 'off',
    },
  },
  {
    // Tests are exempted from boundary rules
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'test/**/*.ts'],
    rules: {
      'boundaries/element-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
