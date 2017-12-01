# file-write-tester

- Write files [with streams] to a directory for test purposes.
- Writing is contiguous.
- Content is random based on the `bs` size.

## Use with Command-line

### Install
```
npm install file-write-tester -g
```

### Usage
```
Usage: file-write-tester <dir> [options]


Options:

-V, --version             output the version number
--folders <folders>       The number of folders per depth. (default: 20)
--files <files>           The number of files per folder. (default: 1000)
--depth <depth>           The number of folders deep. (default: 2)
--streams <streams>       The number of streams per file. (default: 8)
--size <size>             The size of each file. (default: 67108864)
--bs <bs>                 The payload write size. (default: 524288)
--parallelWrites <count>  The number of parallel writes to perform. (default: 8)
--stream_size <size>      The size of each stream. (default: 256)
--stream_bs <bs>          The payload write size for streams. (default: 256)
-h, --help                output usage information
```

### Example
```
file-write-tester 
    O:/target_folder 
    --folders 2
    --depth 1
    --files 4
    --size 4MB
    --bs 1MB
    --streams 1

1 0.004GB(0MB/s)[3] : O:/target_folder/1/1/1.file
5 0.015GB(0MB/s)[3] : O:/target_folder/1/1/1.file:0
5 0.016GB(0MB/s)[2] : O:/target_folder/1/1/2.file
5 0.016GB(0MB/s)[2] : O:/target_folder/1/1/4.file
5 0.016GB(0MB/s)[2] : O:/target_folder/1/1/3.file
8 0.016GB(0MB/s)[2] : O:/target_folder/1/1/2.file:0
8 0.016GB(0MB/s)[1] : O:/target_folder/1/1/4.file:0
8 0.016GB(0MB/s)[0] : O:/target_folder/1/1/3.file:0
9 0.020GB(2.67MB/s)[3] : O:/target_folder/1/2/1.file
13 0.029GB(2.67MB/s)[3] : O:/target_folder/1/2/1.file:0
13 0.031GB(2.67MB/s)[2] : O:/target_folder/1/2/3.file
13 0.031GB(2.67MB/s)[2] : O:/target_folder/1/2/2.file
13 0.031GB(2.67MB/s)[2] : O:/target_folder/1/2/4.file
16 0.031GB(2.67MB/s)[2] : O:/target_folder/1/2/3.file:0
16 0.031GB(2.67MB/s)[1] : O:/target_folder/1/2/2.file:0
16 0.031GB(2.67MB/s)[0] : O:/target_folder/1/2/4.file:0
20 0.047GB(2.67MB/s)[3] : O:/target_folder/2/1/3.file
20 0.047GB(2.67MB/s)[3] : O:/target_folder/2/1/1.file
20 0.047GB(2.67MB/s)[3] : O:/target_folder/2/1/4.file
20 0.047GB(2.67MB/s)[3] : O:/target_folder/2/1/2.file
24 0.047GB(2.67MB/s)[3] : O:/target_folder/2/1/3.file:0
24 0.047GB(2.67MB/s)[2] : O:/target_folder/2/1/1.file:0
24 0.047GB(2.67MB/s)[1] : O:/target_folder/2/1/4.file:0
24 0.047GB(2.67MB/s)[0] : O:/target_folder/2/1/2.file:0
25 0.051GB(8.06MB/s)[3] : O:/target_folder/2/2/1.file
26 0.051GB(8.06MB/s)[3] : O:/target_folder/2/2/1.file:0
29 0.063GB(8.06MB/s)[2] : O:/target_folder/2/2/4.file
29 0.063GB(8.06MB/s)[2] : O:/target_folder/2/2/2.file
29 0.063GB(8.06MB/s)[2] : O:/target_folder/2/2/3.file
32 0.063GB(8.06MB/s)[2] : O:/target_folder/2/2/4.file:0
32 0.063GB(8.06MB/s)[1] : O:/target_folder/2/2/2.file:0
32 0.063GB(8.06MB/s)[0] : O:/target_folder/2/2/3.file:0
file-write-tester complete
```

## Use with Code

