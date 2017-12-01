const assert                             = require('assert')
const fs                                 = require('fs')
const mkdirp                             = require('mkdirp')
const {range}                            = require('range')
const {series, parallelLimit, waterfall} = require('async')
const bytes                              = require('bytes')
const {EventEmitter}                     = require('events')

class Writer extends EventEmitter {
    constructor({dir, folders, depth, files, size, bs, streams, stream_size, stream_bs, parallelWrites}) {
        super()
        assert.ok(typeof dir === 'string', `dir (${dir}) must be a string`)
        assert.ok(typeof folders === 'number', `folders (${folders}) must be a number`)
        assert.ok(typeof depth === 'number', `depth (${depth}) must be a number`)
        assert.ok(typeof files === 'number', `files (${files}) must be a number`)
        assert.ok(typeof size === 'number', `size (${size}) must be a number`)
        assert.ok(typeof bs === 'number', `bs (${bs}) must be a number`)
        assert.ok(typeof streams === 'number', `streams (${streams}) must be a number`)
        assert.ok(typeof stream_size === 'number', `stream_size (${stream_size}) must be a number`)
        assert.ok(typeof stream_bs === 'number', `stream_bs (${stream_bs}) must be a number`)
        assert.ok(typeof parallelWrites === 'number', `parallelWrites (${parallelWrites}) must be a number`)

        this.dir            = dir
        this.folders        = folders
        this.depth          = depth
        this.files          = files
        this.size           = size
        this.bs             = bs
        this.streams        = streams
        this.stream_size    = stream_size
        this.stream_bs      = stream_bs
        this.parallelWrites = parallelWrites


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
        this.startStatTracking()
        mkdirp(this.dir, err => {
            this.writeFolders(this.dir, this.depth, err => {
                this.stopStatTracking()
                return done(err)
            })
        })
    }

    writeFolders(dir, depth, done) {
        const tasks = range(1, this.folders).map(number => done => {
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
            const tasks = range(1, this.files).map(number => done => {
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
        this.stats.writesInProgress++
        const buf = buffer(bs)
        for (let i = 0; i < bs; i++) buf[i] = (Math.random() * 256) ^ 0
        waterfall([
                done => fs.unlink(file, err => done()),
                done => fs.open(file, 'a', (err, fd) => {
                    this.stats.filesCreated++
                    done(err, fd)
                }),
            ].concat(
            range(0, size, bs).map(position =>
                (fd, done) => {
                    fs.write(fd, buf, 0, bs, position, err => {
                        if (!err) {
                            this.stats.bytesWritten += bs
                        }
                        done(err, fd)
                    })
                })
            ), (err, fd) => {
                fs.close(fd, err2 => {
                        this.log(file)
                        this.stats.writesInProgress--
                        done(err || err2)
                    }
                )
            }
        )
    }

    log(msg = '') {
        this.emit('log', `${this.stats.toString()} : ${msg}`)
    }
}

module.exports = Writer


const buffer = size => Buffer.alloc(size);
