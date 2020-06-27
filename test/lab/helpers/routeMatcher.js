'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('Helpers', () => {
    describe('routeMatcher', () => {
        describe('when binding pattern is abc.xyz', () => {
            const pattern = 'abc.xyz';

            it('should match for abc.xyz', () => {
                expect(Helpers.routeMatcher(pattern, 'abc.xyz')).to.be.true();
            });

            it('should not match for xyz.abc', () => {
                expect(Helpers.routeMatcher(pattern, 'xyz.abc')).to.be.false();
            });
        });

        describe('when binding pattern is abc.xyz-rpq_mno', () => {
            const pattern = 'abc.xyz-rpq_mno';

            it('should match for abc.xyz-rpq_mno', () => {
                expect(Helpers.routeMatcher(pattern, 'abc.xyz-rpq_mno')).to.be.true();
            });

            it('should not match for xyz.abc-rpq_mno', () => {
                expect(Helpers.routeMatcher(pattern, 'xyz.abc-rpq_mno')).to.be.false();
            });
        });

        describe('when binding pattern is a.*', () => {
            const pattern = 'a.*';

            it('should match for a.hello', () => {
                expect(Helpers.routeMatcher(pattern, 'a.hello')).to.be.true();
            });

            it('should match for a.hello', () => {
                expect(Helpers.routeMatcher(pattern, 'a.')).to.be.true();
            });

            it('should not match for a.hello.world', () => {
                expect(Helpers.routeMatcher(pattern, 'a.hello.world')).to.be.false();
            });
        });

        describe('when binding pattern is *.a', () => {
            const pattern = '*.a';

            it('should match for hello.a', () => {
                expect(Helpers.routeMatcher(pattern, 'hello.a')).to.be.true();
            });

            it('should match for .a', () => {
                expect(Helpers.routeMatcher(pattern, '.a')).to.be.true();
            });

            it('should not match for world.hello.a', () => {
                expect(Helpers.routeMatcher(pattern, 'world.hello.a')).to.be.false();
            });
        });

        describe('when binding pattern is a.#', () => {
            const pattern = 'a.#';

            it('should match for a.hello', () => {
                expect(Helpers.routeMatcher(pattern, 'a.hello')).to.be.true();
            });

            it('should match for a.hello.world', () => {
                expect(Helpers.routeMatcher(pattern, 'a.hello.world')).to.be.true();
            });

            it('should match for a.', () => {
                expect(Helpers.routeMatcher(pattern, 'a.')).to.be.true();
            });

            it('should not match for b.a.hello.world', () => {
                expect(Helpers.routeMatcher(pattern, 'b.a.hello.world')).to.be.false();
            });
        });

        describe('when binding pattern is a.*.b', () => {
            const pattern = 'a.*.b';

            it('should match for a.c.b', () => {
                expect(Helpers.routeMatcher(pattern, 'a.c.b')).to.be.true();
            });

            it('should match for a..b', () => {
                expect(Helpers.routeMatcher(pattern, 'a..b')).to.be.true();
            });

            it('should not match for a.b', () => {
                expect(Helpers.routeMatcher(pattern, 'a.b')).to.be.false();
            });

            it('should not match for a.n.d.b', () => {
                expect(Helpers.routeMatcher(pattern, 'a.n.d.b')).to.be.false();
            });
        });

        describe('when binding pattern is a.#.b', () => {
            const pattern = 'a.#.b';

            it('should match for a.hello.b', () => {
                expect(Helpers.routeMatcher(pattern, 'a.hello.b')).to.be.true();
            });

            it('should match for a.hello.world.b', () => {
                expect(Helpers.routeMatcher(pattern, 'a.hello.world.b')).to.be.true();
            });

            it('should not match for a.b', () => {
                expect(Helpers.routeMatcher(pattern, 'a.b')).to.be.false();
            });

            it('should match for a..b', () => {
                expect(Helpers.routeMatcher(pattern, 'a..b')).to.be.true();
            });

            it('should not match for hello.world.b', () => {
                expect(Helpers.routeMatcher(pattern, 'hello.world.b')).to.be.false();
            });

            it('should not match for a.hello.world', () => {
                expect(Helpers.routeMatcher(pattern, 'a.hello.world')).to.be.false();
            });
        });

        describe('when binding pattern is a.#.b-_c', () => {
            const pattern = 'a.#.b-_c';

            it('should match for a.hello.world.b-_c', () => {
                expect(Helpers.routeMatcher(pattern, 'a.hello.world.b-_c')).to.be.true();
            });

            it('should match for a.h-e-l-l-o.w-o-r-l-d.b-_c', () => {
                expect(Helpers.routeMatcher(pattern, 'a.h-e-l-l-o.w-o-r-l-d.b-_c')).to.be.true();
            });

            it('should match for a.h_e_l_l_o.w_o_r_l_d.b-_c', () => {
                expect(Helpers.routeMatcher(pattern, 'a.h-e-l-l-o.w-o-r-l-d.b-_c')).to.be.true();
            });

            it('should match for a.h-e_l-l_o.w_o-r_l-d.b-_c', () => {
                expect(Helpers.routeMatcher(pattern, 'a.h-e-l-l-o.w-o-r-l-d.b-_c')).to.be.true();
            });

            it('should not match for b.h-e_l-l_o.w_o-r_l-d.b-_c', () => {
                expect(Helpers.routeMatcher(pattern, 'b.h-e_l-l_o.w_o-r_l-d.b-_c')).to.be.false();
            });

            it('should not match for a.h-e_l-l_o.w_o-r_l-d.b', () => {
                expect(Helpers.routeMatcher(pattern, 'a.h-e_l-l_o.w_o-r_l-d.b')).to.be.false();
            });
        });

        describe('when binding pattern is abc.#.xyz', () => {
            const pattern = 'abc.#.xyz';

            it('should match for abc.hello.xyz', () => {
                expect(Helpers.routeMatcher(pattern, 'abc.hello.xyz')).to.be.true();
            });

            it('should match for abc.hello.world.xyz', () => {
                expect(Helpers.routeMatcher(pattern, 'abc.hello.world.xyz')).to.be.true();
            });

            it('should match for abc..xyz', () => {
                expect(Helpers.routeMatcher(pattern, 'abc..xyz')).to.be.true();
            });

            it('should not match for abc.xyz', () => {
                expect(Helpers.routeMatcher(pattern, 'abc.xyz')).to.be.false();
            });
        });

        describe('when binding pattern is .#.', () => {
            const pattern = '.#.';

            it('should match for .a.', () => {
                expect(Helpers.routeMatcher(pattern, '.a.')).to.be.true();
            });

            it('should match for .#.', () => {
                expect(Helpers.routeMatcher(pattern, '.#.')).to.be.true();
            });

            it('should match for ..', () => {
                expect(Helpers.routeMatcher(pattern, '..')).to.be.true();
            });

            it('should match for ....', () => {
                expect(Helpers.routeMatcher(pattern, '....')).to.be.true();
            });
        });

        describe('when binding pattern is .*.', () => {
            const pattern = '.#.';

            it('should match for .a.', () => {
                expect(Helpers.routeMatcher(pattern, '.a.')).to.be.true();
            });

            it('should match for .#.', () => {
                expect(Helpers.routeMatcher(pattern, '.#.')).to.be.true();
            });

            it('should match for .#.', () => {
                expect(Helpers.routeMatcher(pattern, '..')).to.be.true();
            });
        });

        describe('when binding pattern is #', () => {
            const pattern = '#';

            it('should match for a.a', () => {
                expect(Helpers.routeMatcher(pattern, 'a.a')).to.be.true();
            });

            it('should match for a.1-2.3.z_y.b', () => {
                expect(Helpers.routeMatcher(pattern, 'a.1-2.3.z_y.b')).to.be.true();
            });

            it('should match for ..', () => {
                expect(Helpers.routeMatcher(pattern, '..')).to.be.true();
            });

            it('should match for ....', () => {
                expect(Helpers.routeMatcher(pattern, '....')).to.be.true();
            });
        });
    });
});
