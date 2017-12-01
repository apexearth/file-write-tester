const {expect} = require('chai')
const Writer   = require('./file-write-tester')

describe('file-write-tester', function () {
    it('creates files with streams in folders', function (done) {
        const writer = new Writer({
            dir        : 'test',
            folders    : 4,
            depth      : 1,
            files      : 4,
            size       : Math.pow(1024, 2) * 4,
            bs         : Math.pow(1024, 2) * .5,
            streams    : 2,
            stream_size: 512,
            stream_bs  : 256,
            overwrite  : true,
        })
        const files = []
        writer.on('file', file => files.push(file))
        writer.start(err => {
            expect(writer.stats.bytesWritten).to.equal(268500992)
            expect(writer.stats.writesInProgress).to.equal(0)
            expect(files.length).to.equal(192)
            return done(err)
        })
    })
});