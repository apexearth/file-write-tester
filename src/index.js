const pkg     = require('../package.json');
const program = require('commander');
const Writer  = require('./file-write-tester');
const bytes   = require('bytes');

program
    .version(pkg.version)
    .usage('<dir> [options]')
    .option('--folders <folders>', 'The number of folders per depth.', n => parseInt(n), 20)
    .option('--files <files>', 'The number of files per folder.', n => parseInt(n), 1000)
    .option('--depth <depth>', 'The number of folders deep.', n => parseInt(n), 2)
    .option('--streams <streams>', 'The number of streams per file.', n => parseInt(n), 8)
    .option('--size <size>', 'The size of each file.', bytes.parse, bytes.parse('64MB'))
    .option('--bs <bs>', 'The payload write size.', bytes.parse, bytes.parse('512KB'))
    .option('--parallelWrites <count>', 'The number of parallel writes to perform.', n => parseInt(n), 8)
    .option('--stream_size <size>', 'The size of each stream.', bytes.parse, bytes.parse('256B'))
    .option('--stream_bs <bs>', 'The payload write size for streams.', bytes.parse, bytes.parse('256B'))
    .parse(process.argv)

program.dir = program.args[0]
if (!program.dir) {
    program.outputHelp()
    return
}

const writer = new Writer(program)
writer.on('file', file => console.log(writer.stats.toString() + " : " + file))
writer.on('stats', stats => console.log(stats.toString()))
writer.start(err => {
    if (err)
        console.error(err)
    else
        console.log('file-write-tester complete')
})
