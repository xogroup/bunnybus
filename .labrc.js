'use strict';

const LabConfig = {
    coverage: true,
    reporter: ['console', 'html'],
    output: ['stdout', 'coverage/coverage.html'],
    lint: true,
    verbose: false
};

module.exports = LabConfig;
