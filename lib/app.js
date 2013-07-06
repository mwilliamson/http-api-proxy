var fs = require("fs");
var url = require("url");

var apiProxy = require("./");
var hosts = require("./hosts");

var argParser = require('optimist')
    .demand("c")
    .usage(
        "http-api-proxy [-c <config-file.json>]\n" +
        "Example config file:\n" +
        '{\n' +
        '    "sites": [\n' +
        '       {\n' +
        '           "upstream": "example.com",\n' +
        '           "interval": 1000\n' +
        '       }\n' +
        '    ],\n' +
        '    "port": 8080\n' +
        '}'
    );

exports.run = function(args) {
    var argv = argParser.parse(args);
    
    var config = JSON.parse(fs.readFileSync(argv.c, "utf8"));
    var sites = config.sites.map(function(site) {
        return {
            interval: site.interval,
            upstream: url.parse(site.upstream)
        };
    });
    var options = {
        cacheAge: config.cacheAge,
        cachePath: config.cachePath
    };
    var port = config.port;

    return apiProxy.createServer(sites, options).listen(port);
}
