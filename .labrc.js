'use strict';

module.exports = {
    assert : '@hapi/code',
    coverage: true,
    'coverage-all': true,
    'coverage-exclude': ['jest.config.js', 'test/jest/cleanup.test.js'],
    threshold: 90,
    lint: true,
    verbose: true
};