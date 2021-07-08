'use strict';

module.exports = {
    extends: ['@hapi/eslint-config-hapi', 'prettier'],
    plugins: ['@hapi/eslint-plugin-hapi', 'prettier'],
    rules: {
        'require-await': 'off',
        'no-unused-vars': 'off',
        'consistent-this': [0, 'self', '$'],
        'prettier/prettier': 'error',
        '@hapi/hapi/scope-start': 'off'
    }
};
