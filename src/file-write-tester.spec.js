const writer = require('./file-write-tester')

describe('file-write-tester', function () {
    it('creates files with streams in folders', function(done) {
        writer('test/')
    })
});