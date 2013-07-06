var fs = require("fs");
var url = require("url");

var apiProxy = require("./");
var hosts = require("./hosts");

var argParser = require('optimist')
    .usage(
        "http-api-proxy [-c <config-file.json>]\n" +
        "http-api-proxy <hostname>[:<port>] --interval=<interval> --port=<port> [--cache=<cache-age>] [--cache-path=<cache-path>]\n" +
        "Example config file:\n" +
        '{\n' +
        '    "sites": [\n' +
        '       {\n' +
        '           "upstream": "example.com",\n' +
        '           "interval": 1000\n' +
        '       }\n' +
        '    ],\n' +
        '    "port": 8080' +
        '}'
    );

exports.run = function(args) {
    var argv = argParser.parse(args);
    
    if (argv.c) {
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
    } else {
        var host = argv._[0];
        var upstream = hosts.parseHost(host);

        var interval = parseInt(argv.interval, 10);
        
        var sites = [
            {
                interval: interval,
                upstream: upstream
            }
        ];
    
        var options = {
            cacheAge: argv.cache,
            cachePath: argv["cache-path"]
        };
        var port = parseInt(argv.port, 10);
    }

    return apiProxy.createServer(sites, options).listen(port);
}
