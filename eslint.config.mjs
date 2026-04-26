import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier, // Disable ESLint rules that conflict with Prettier
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**']
  }
);
