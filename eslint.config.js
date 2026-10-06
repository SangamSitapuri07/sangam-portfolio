import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'legacy-nextjs/**', 'tools/**', '.qa/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      /* React Compiler's purity rules assume state lives in React. This scene is
         the opposite by design: three.js objects (the renderer, materials, the
         camera, the scene graph) are mutated imperatively from the frame loop and
         from effects, because per-frame React state is exactly what the brief
         forbids. Mutating them is the documented R3F pattern, so these stay
         warnings rather than errors — the screen painters and the rig harness
         cover the behaviour they cannot reason about. */
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]
