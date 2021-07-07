module.exports = {
    root: true,
    env: {
        es2021: true,
        node: true,
    },
    extends: [
        'airbnb-base',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    plugins: [
        '@typescript-eslint',
    ],
    rules: {
        indent: ['error', 4],
        'no-underscore-dangle': 'off',
        'import/extensions': 'off',
        'import/no-unresolved': 'off'
    },
};
