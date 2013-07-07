var fs = require("fs");
var url = require("url");
var path = require("path");

var xdg = require("xdg");

var apiProxy = require("./");
var hosts = require("./hosts");

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
        '    "port": 8080\n' +
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
        cachePath: config.cachePath
    };
    var port = config.port;

    return apiProxy.createServer(sites, options).listen(port);
}

function findConfigPath(path) {
    if (path) {
        return path;
    } else {
        return xdg.basedir.configPath("http-api-proxy/config.json");
    }
}
