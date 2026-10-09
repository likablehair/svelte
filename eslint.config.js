import tseslint from 'typescript-eslint';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  ...tseslint.configs.recommended,
  ...sveltePlugin.configs['flat/recommended'],
  prettierConfig,
  {
    // Rules changed severity in @typescript-eslint v8 vs v5
    rules: {
      'no-undef': 0,
      '@typescript-eslint/no-empty-function': 0,
      'no-redeclare': 0,
      'no-irregular-whitespace': [2, { skipComments: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-wrapper-object-types': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  },
  {
    files: ['*.svelte', '**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      // These were not enforced on .svelte files with the old svelte3 plugin
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      // New opinionated svelte rules not present in the old svelte3 plugin
      'svelte/require-each-key': 'off',
      'svelte/prefer-writable-derived': 'off',
      'svelte/prefer-svelte-reactivity': 'off',
      'svelte/no-useless-mustaches': 'warn',
      'svelte/no-navigation-without-resolve': 'off',
      'svelte/no-unknown-style-directive-property': 'warn',
      'svelte/no-at-html-tags': 'warn',
    },
  },
  {
    ignores: ['*.cjs', '.svelte-kit/**', 'dist/**', 'build/**', 'aurora/**'],
  },
);
