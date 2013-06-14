var http = require('http');
var connect = require("connect");

var httpProxy = require('http-proxy');
var rateLimit = require("rate-limit");
var connectResponseCache = require("connect-response-cache");

exports.createServer = createServer;
exports.app = require("./app");

function createServer(options) {
    var proxyQueue = rateLimit.createQueue({interval: options.interval});
    
    var proxy = new httpProxy.RoutingProxy();
    
    var proxyMiddleware = function(request, response) {
        var buffer = request._apiProxyBuffer;
        proxyQueue.add(function() {
            proxy.proxyRequest(request, response, {
                host: options.upstream.hostname,
                port: options.upstream.port,
                buffer: buffer
            });
        });
    };
    
    var app = connect();
    
    app.use(function(request, response, next) {
        request._apiProxyBuffer = httpProxy.buffer(request);
        next();
    });
    
    if (options.cacheAge) {
        app.use(connectResponseCache({maxAge: options.cacheAge}));
    }
    
    app.use(proxyMiddleware);
    
    return http.createServer(app);
}
