'use strict';

module.exports = {
    extends: ['plugin:@hapi/module', 'prettier'],
    plugins: ['prettier'],
    rules: {
        'require-await': 'off',
        'no-unused-vars': 'off',
        'consistent-this': [0, 'self', '$'],
        'prettier/prettier': 'error',
        '@hapi/scope-start': 'off'
    }
};
