var http = require('http');
var connect = require("connect");

var httpProxy = require('http-proxy');
var rateLimit = require("rate-limit");
var connectResponseCache = require("connect-response-cache");

var hosts = require("./hosts");

exports.createServer = createServer;
exports.app = require("./app");

function createServer(sites, options) {
    var proxyQueues = {};
    
    sites.forEach(function(site) {
        var host = site.upstream.hostname + ":" + site.upstream.port;
        proxyQueues[host] = rateLimit.createQueue({interval: site.interval});
    });
    
    var proxy = new httpProxy.RoutingProxy();
    
    var proxyMiddleware = function(request, response) {
        var buffer = request._apiProxyBuffer;
        var requestHost = hosts.parseHost(request.headers.host);
        var proxyQueue = proxyQueues[requestHost.toString()];
        
        proxyQueue.add(function() {
            proxy.proxyRequest(request, response, {
                host: requestHost.hostname,
                port: requestHost.port,
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

