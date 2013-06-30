var fs = require("fs");
var url = require("url");

var apiProxy = require("./");
var hosts = require("./hosts");

var argParser = require('optimist')
    .demand("port")
    .usage(
        "http-api-proxy <hostname>[:<port>] --interval=<interval> --port=<port> [--cache=<cache-age>]\n" +
        "http-api-proxy -c <config-file.json> --port=<port> [--cache=<cache-age>]\n\n" +
        "Example config file:\n" +
        '{\n' +
        '    "sites": [\n' +
        '       {\n' +
        '           "upstream": "example.com",\n' +
        '           "interval": 1000\n' +
        '       }\n' +
        '    ]\n' +
        '}'
    );

exports.run = function(args) {
    var argv = argParser.parse(args);
    var port = parseInt(argv.port, 10);
    
    if (argv.c) {
        var config = JSON.parse(fs.readFileSync(argv.c, "utf8"));
        var sites = config.sites.map(function(site) {
            return {
                interval: site.interval,
                upstream: url.parse(site.upstream)
            };
        });
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
    }
    
    var options = {
        cacheAge: argv.cache
    };

    return apiProxy.createServer(sites, options).listen(port);
}
