const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([expo, { ignores: ['dist/*', 'legacy/*', 'public/*'] }, { files: ['scripts/*.cjs'], languageOptions: { globals: { __dirname: 'readonly' } } }]);
