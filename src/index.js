const pkg     = require('../package.json');
const program = require('commander');
const writer  = require('./file-write-tester');
const bytes   = require('bytes');

program
    .version(pkg.version)
    .arguments('<dir> [folders] [depth] [files] [streams] [size] [bs]')
    .action((dir, folders = 20, depth = 2, files = 1000, streams = 8, size = '20MB', bs = '2MB') => {
        size    = bytes.parse(size);
        bs      = bytes.parse(bs);
        folders = Number(folders)
        depth   = Number(depth)
        files   = Number(files)
        streams = Number(streams)

        writer(dir, folders, depth, files, streams, size, bs, err => {
            if (err)
                console.error(err)
            else
                console.log('file-writer complete')
        })
    });

if (process.argv.length <= 2) {
    program.outputHelp();
} else {
    program.parse(process.argv);
}

