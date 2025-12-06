module.exports = {
  // Lint and format TypeScript/JavaScript files
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{js,jsx}': ['eslint --fix', 'prettier --write'],

  // Format JSON files
  '*.json': ['prettier --write'],

  // Format CSS files
  '*.css': ['prettier --write'],
};

