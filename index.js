const commandLineArgs = require('command-line-args');
const request = require('request');
const fs  = require('fs');
const path = require('path');
const _ = require('lodash');

const optionDefinitions = [{
    name: 'host',
    alias: 'h',
    type: String
}, {
    name: 'port',
    alias: 'p',
    type: Number
},{
    name: 'target',
    alias: 't',
    type: String
}];

const options = commandLineArgs(optionDefinitions);

const baseUrl = 'http://' + options.host + ':' + options.port + '/files';

console.log(baseUrl);

function download(target, files, idx) {
    request(baseUrl + '/' + files[idx])
        .on('start', function() {
            console.log('Start to download file: ' + files[idx]);
        })
        .on('end', function() {
            console.log('Download completed for file: ' + files[idx]);
            if (idx < files.length - 1) {
                download(target, files, idx + 1);
            }
            else {
                console.log(files.length + " files downloaded");
            }
        })
        .on('error', function (error) {
            console.log("Error occurred for file " + idx + " on " + files.length);
            console.log(error);
        })
        .pipe(fs.createWriteStream(path.join(target, files[idx])));
}

request(baseUrl, function(error, response, body) {
    files = JSON.parse(body);
    console.log(files.length + " files to download");
    download(options.target, files, 0);
});