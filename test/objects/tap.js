var u = require('../../dist/main');

describe('tap tests', function() {
    it('tap object', function() {
        var obj = {a: 1, b: 2};
        var interceptor = jasmine.createSpy('interceptor');
        var result = u()
            .tap(interceptor)
            .map()
            .process(obj);
        expect(result).toEqual([1, 2]);
        expect(interceptor).toHaveBeenCalledWith(obj);
    });
});