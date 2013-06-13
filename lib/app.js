var apiProxy = require("./");

exports.run = function(args) {
    var argv = require('optimist')
        .usage("http-api-proxy <hostname>[:<port>] --interval=<interval> --port=<port>")
        .demand(1)
        .demand("interval")
        .demand("port")
        .parse(args);

    var host = argv._[0];
    var hostParts = host.split(":");
    var upstream;
    if (hostParts.length === 1) {
        upstream = {
            hostname: host,
            port: 80
        }
    } else {
        upstream = {
            hostname: hostParts[0],
            port: hostParts[1]
        };
    }

    var port = parseInt(argv.port, 10);
    var interval = parseInt(argv.interval, 10);


    return apiProxy.createServer({
        interval: interval,
        upstream: upstream
    }).listen(port);
}
