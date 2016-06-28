var fs = require("fs");
var url = require("url");

var xdg = require("xdg");

var apiProxy = require("./");

var argParser = require('optimist')
    .usage(
        "http-api-proxy [-c <config-file.json>]\n" +
        "Example config file:\n" +
        '{\n' +
        '    "sites": [\n' +
        '       {\n' +
        '           "upstream": "http://example.com",\n' +
        '           "interval": 1000\n' +
        '       }\n' +
        '    ],\n' +
        '    "httpPort": 8080,\n' +
        '    "httpsPort": 8081\n' +
        '}'
    );

exports.run = function(args) {
    var argv = argParser.parse(args);
    
    var configPath = findConfigPath(argv.c);
    
    var config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    var sites = config.sites.map(function(site) {
        return {
            interval: site.interval,
            upstream: url.parse(site.upstream)
        };
    });
    var options = {
        cacheAge: config.cacheAge,
        cachePath: config.cachePath,
        httpPort: config.httpPort,
        httpsPort: config.httpsPort,
        defaultInterval: config.defaultInterval
    };
    return apiProxy.startServer(sites, options);
};

function findConfigPath(path) {
    if (path) {
        return path;
    } else {
        return xdg.basedir.configPath("http-api-proxy/config.json");
    }
}
