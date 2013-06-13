var http = require('http');

var httpProxy = require('http-proxy');
var rateLimit = require("rate-limit");

exports.createServer = createServer;
exports.app = require("./app");

function createServer(options) {
    var proxyQueue = rateLimit.createQueue({interval: options.interval});

    return httpProxy.createServer(function(req, res, proxy) {
        var buffer = httpProxy.buffer(req);
        proxyQueue.add(function() {
            proxy.proxyRequest(req, res, {
                host: options.upstream.hostname,
                port: options.upstream.port,
                buffer: buffer
            });
        });
    });
}
