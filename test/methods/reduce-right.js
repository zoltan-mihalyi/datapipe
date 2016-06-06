var dp = require('../../dist/datapipe');

describe('reduceRight tests', function() {
    it('Calling reduceRight should work as expected.', function() {
        expect(dp().reduceRight(function(memo, x) {
            return memo + x;
        }, '').process(['a', 'b', 'c', 'd', 'e'])).toBe('edcba');
    });

    it('reduceRight with context', function() {
        expect(dp().reduceRight(function(memo, x) {
            return memo + x + this.value;
        }, '', {value: '-'}).process(['a', 'b', 'c', 'd', 'e'])).toBe('e-d-c-b-a-');
    });
});