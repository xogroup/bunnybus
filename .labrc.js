'use strict';

const LabConfig = {
    coverage: true,
    reporter: ['console', 'html'],
    output: ['stdout', 'coverage/coverage.html'],
    lint: false,
    verbose: true,
    sourcemaps: true
};

module.exports = LabConfig;
