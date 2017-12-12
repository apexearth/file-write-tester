const assert                             = require('assert')
const fs                                 = require('fs')
const mkdirp                             = require('mkdirp')
const {range}                            = require('range')
const {series, parallelLimit, waterfall} = require('async')
const bytes                              = require('bytes')
const {EventEmitter}                     = require('events')

class Writer extends EventEmitter {
    constructor({
        dir = 'file-write-tester',
        folders = 10,
        depth = 2,
        files = 128,
        size = Math.pow(1024, 3) * 4,
        bs = Math.pow(1024, 3) * .5,
        streams = 0,
        stream_size = 256,
        stream_bs = 256,
        parallelWrites = 8,
        overwrite = false,
        overwrite_chance = 1.0,
    }) {
        super()
        assert.ok(typeof dir === 'string', `dir (${dir}) must be a string`)
        assert.ok(folders > 0, `folders (${folders}) must be greater than 0`)
        assert.ok(depth >= 0, `depth (${depth}) must be greater than or equal to 0`)
        assert.ok(files > 0, `files (${files}) must be greater than 0`)
        assert.ok(typeof size === 'number', `size (${size}) must be a number`)
        assert.ok(typeof bs === 'number', `bs (${bs}) must be a number`)
        assert.ok(typeof streams === 'number', `streams (${streams}) must be a number`)
        assert.ok(typeof stream_size === 'number', `stream_size (${stream_size}) must be a number`)
        assert.ok(typeof stream_bs === 'number', `stream_bs (${stream_bs}) must be a number`)
        assert.ok(typeof parallelWrites === 'number', `parallelWrites (${parallelWrites}) must be a number`)
        assert.ok(typeof overwrite === 'boolean', `overwrite (${overwrite}) must be a boolean`)
        assert.ok(typeof overwrite_chance === 'number', `overwrite_chance (${overwrite_chance}) must be a number`)

        this.dir              = dir
        this.folders          = folders
        this.depth            = depth
        this.files            = files
        this.size             = size
        this.bs               = bs
        this.streams          = streams
        this.stream_size      = stream_size
        this.stream_bs        = stream_bs
        this.parallelWrites   = parallelWrites
        this.overwrite        = overwrite
        this.overwrite_chance = overwrite_chance

        this.stats = {
            filesCreated          : 0,
            bytesWritten          : 0,
            bytesWrittenLastSecond: 0,
            bytesWrittenPerSecond : 0,
            streamsCreated        : 0,
            writesInProgress      : 0,
            toString              : () => {
                let created          = this.stats.filesCreated
                let written          = bytes(this.stats.bytesWritten, {unit: 'GB', decimalPlaces: 3})
                let writtenPerSecond = bytes(this.stats.bytesWrittenPerSecond, {unit: 'MB', decimalPlaces: 2})
                let writesInProgress = this.stats.writesInProgress
                return `${created} ${written}(${writtenPerSecond}/s)[${writesInProgress}]`
            }
        }
    }

    startStatTracking() {
        if (this.statIntervalId) throw new Error('Already tracking stats!')
        this.statIntervalId = setInterval(() => {
            this.stats.bytesWrittenPerSecond  = ((this.stats.bytesWrittenPerSecond * 5) + (this.stats.bytesWritten - this.stats.bytesWrittenLastSecond)) / 6
            this.stats.bytesWrittenLastSecond = this.stats.bytesWritten
            this.emit('stats', this.stats)
        }, 1000)
    }

    stopStatTracking() {
        clearInterval(this.statIntervalId)
        this.statIntervalId = undefined
    }

    start(done) {
        console.log('===========================')
        console.log('file-write-tester starting:')
        console.log('===========================')
        Object.keys(this)
            .filter(key => key[0] !== '_' && ['domain', 'stats'].indexOf(key) === -1)
            .map(key => {
                console.log(`${key}: ${this[key]}`)
            })
        console.log('===========================')
        this.startStatTracking()
        mkdirp(this.dir, err => {
            this.writeFolders(this.dir, this.depth, err => {
                this.stopStatTracking()
                return done(err)
            })
        })
    }

    writeFolders(dir, depth, done) {
        const tasks = range(1, this.folders + 1).map(number => done => {
            if (depth) {
                this.writeFolders(`${dir}/${number}`, depth - 1, done)
            } else {
                this.writeFolder(`${dir}/${number}`, done)
            }
        })
        series(tasks, done)
    }

    writeFolder(dir, done) {
        mkdirp(dir, err => {
            const tasks = range(1, this.files + 1).map(number => done => {
                this.writeFileWithStreams(`${dir}/${number}.file`, this.streams, done)
            })
            parallelLimit(tasks, this.parallelWrites, done)
        })
    }

    writeFileWithStreams(file, streams, done) {
        const tasks = [
            done => this.writeFile(file, this.size, this.bs, done),
            ...range(0, streams).map(number =>
                done => this.writeFile(`${file}:${number}`, this.stream_size, this.stream_bs, done)
            )
        ]
        series(tasks, done)
    }

    writeFile(file, size, bs, done) {
        const skipMessage      = `${file} (skipped)`
        const buf              = Buffer.alloc(bs)
        const overwrite_chance = 1 - Math.random()
        for (let i = 0; i < bs; i++) buf[i] = (Math.random() * 256) ^ 0
        waterfall([
            done => fs.stat(file, (err, stat) => {
                if (stat && (!this.overwrite || overwrite_chance >= this.overwrite_chance)) {
                    return done(skipMessage)
                } else {
                    return done()
                }
            }),
            done => fs.unlink(file, err => done()),
            done => fs.open(file, 'a', (err, fd) => {
                this.stats.writesInProgress++
                this.stats.filesCreated++
                done(err, fd)
            }),
            ...range(0, size, bs).map(position =>
                (fd, done) => {
                    fs.write(fd, buf, 0, bs, position, err => {
                        if (!err) {
                            this.stats.bytesWritten += bs
                        }
                        done(err, fd)
                    })
                })
        ], (err, fd) => {
            if (err === skipMessage) {
                this.log(skipMessage)
                this.emit('file', skipMessage)
                return done()
            }
            fs.close(fd, err2 => {
                    this.stats.writesInProgress--
                    this.log(file)
                    this.emit('file', file)
                    return done(err || err2)
                }
            )
        })
    }

    log(msg = '') {
        this.emit('log', `${this.stats.toString()} : ${msg}`)
    }
}

module.exports = Writer
