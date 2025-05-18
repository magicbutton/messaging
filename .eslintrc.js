module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['dist', 'node_modules', 'docs'],
  rules: {
    'no-unused-vars': 'off'
  }
};