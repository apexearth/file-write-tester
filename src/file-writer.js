const assert                             = require('assert')
const fs                                 = require('fs')
const mkdirp                             = require('mkdirp')
const {range}                            = require('range')
const {series, parallelLimit, waterfall} = require('async')

const writer = (dir, folders, depth, files, streams, size, bs, done) => {
    assert.ok(typeof dir === 'string', `dir (${dir}) must be a string`)
    assert.ok(typeof folders === 'number', `folders (${folders}) must be a number`)
    assert.ok(typeof depth === 'number', `depth (${depth}) must be a number`)
    assert.ok(typeof files === 'number', `files (${files}) must be a number`)
    assert.ok(typeof streams === 'number', `streams (${streams}) must be a number`)
    assert.ok(typeof size === 'number', `size (${size}) must be a number`)
    assert.ok(typeof bs === 'number', `bs (${bs}) must be a number`)

    mkdirp(dir, err => {
        writeFolders(dir, folders, depth, files, streams, size, bs, done)
    })
}

module.exports = writer

const writeFolders = (dir, folders, depth, files, streams, size, bs, done) => {
    const tasks = range(1, folders).map(number => done => {
        if (depth) {
            writeFolders(`${dir}/${number}`, folders, depth - 1, files, streams, size, bs, done)
        } else {
            writeFolder(`${dir}/${number}`, files, streams, size, bs, done)
        }
    })
    series(tasks, done)
}

const writeFolder = (dir, files, streams, size, bs, done) => {
    mkdirp(dir, err => {
        const tasks = range(1, files).map(number => done => {
            writeFile(`${dir}/${number}.file`, streams, size, bs, done)
        })
        parallelLimit(tasks, 16, done)
    })
}

const writeFile = (dir, streams, size, bs, done) => {
    const buf = buffer(bs)
    waterfall([
        done => fs.unlink(dir, err => done()),
        done => fs.open(dir, 'a', done),
    ].concat(
        range(0, size, bs).map(position =>
            (fd, done) => {
                fs.write(fd, buf, 0, bs, position, err => done(err, fd))
            })
    ).concat(
        range(0, streams).map(number =>
            (fd, done) => {
                writeFile(`${dir}:${number}`, 0, 256, 256, err => done(err, fd))
            })
    ), (err, fd) => {
        fs.close(fd, err2 => {
            console.log(`Wrote: ${dir}`)
            done(err || err2)
        })
    })
}

const buffer = size => Buffer.alloc(size);
