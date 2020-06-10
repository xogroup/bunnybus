'use strict';

const regexPatternLookup = {};
const regexTokenLookup = {};
regexTokenLookup['*'] = '[\\d\\w-_*#]*';
regexTokenLookup['#'] = '[\\d\\w-_.*#]*';

const routeMatcher = (pattern, match) => {
    let regex = regexPatternLookup[pattern];

    if (!regex) {
        const regexPattern = [];

        regexPattern.push('^');

        for (const c of pattern) {
            if (regexTokenLookup[c]) {
                regexPattern.push(regexTokenLookup[c]);
            } else {
                regexPattern.push(c);
            }
        }

        regexPattern.push('$');

        regex = new RegExp(regexPattern.join(''));
        regexPatternLookup[pattern] = regex;
    }

    return regex.test(match);
};

module.exports = routeMatcher;
