module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        'no-console': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'error'
    }
};
