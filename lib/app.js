var apiProxy = require("./");
var hosts = require("./hosts");

var argParser = require('optimist')
    .usage("http-api-proxy <hostname>[:<port>] --interval=<interval> --port=<port> [--cache=<cache-age>]")
    .demand(1)
    .demand("interval")
    .demand("port");

exports.run = function(args) {
    var argv = argParser.parse(args);

    var host = argv._[0];
    var upstream = hosts.parseHost(host);
    
    var port = parseInt(argv.port, 10);
    var interval = parseInt(argv.interval, 10);
    
    var sites = [
        {
            interval: interval,
            upstream: upstream
        }
    ];
    
    var options = {
        cacheAge: argv.cache
    };

    return apiProxy.createServer(sites, options).listen(port);
}
