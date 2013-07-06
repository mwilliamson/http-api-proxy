var fs = require("fs");
var url = require("url");
var path = require("path");

var apiProxy = require("./");
var hosts = require("./hosts");

var argParser = require('optimist')
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
        return defaultConfigPath();
    }
}

function defaultConfigPath() {
    return xdgConfigPath("http-api-proxy/config.json");
}

function xdgConfigPath(relativePath) {
    var root = xdgConfigRoot();
    return path.join(root, relativePath);
}

function xdgConfigRoot() {
    var pathFromEnv = process.env.XDG_CONFIG_HOME;
    if (pathFromEnv) {
        return pathFromEnv;
    } else {
        return path.join(process.env.HOME, ".config");
    }
}
