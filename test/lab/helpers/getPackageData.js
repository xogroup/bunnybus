'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('Helpers', () => {
    describe('getPackageData', () => {
        it('should return an identifier with {name, package} filled', () => {
            const result = Helpers.getPackageData();
            const pkg = require('../../../package.json');

            const semverMajor = pkg.version.split('.', 1);

            expect(result).to.exist();
            expect(result.name).to.be.equal(pkg.name);
            expect(result.version).to.be.equal(pkg.version);
            expect(result.semverMatch).to.be.equal(semverMajor + '.x.x');
        });
    });
});
