var http = require('http');
var connect = require("connect");

var httpProxy = require('http-proxy');
var rateLimit = require("rate-limit");
var connectResponseCache = require("connect-response-cache");

var hosts = require("./hosts");

exports.createServer = createServer;
exports.app = require("./app");

function createServer(sites, options) {
    options = options || {};
    
    var proxyQueues = {};
    
    sites.forEach(function(site) {
        var host = site.upstream.hostname + ":" + site.upstream.port;
        proxyQueues[host] = rateLimit.createQueue({interval: site.interval});
    });
    
    var proxy = new httpProxy.RoutingProxy();
    
    var proxyMiddleware = function(request, response) {
        var requestHost = hosts.parseHost(request.headers.host);
        var proxyQueue = proxyQueues[requestHost.toString()];
        
        if (proxyQueue) {
            var buffer = request._apiProxyBuffer;
            proxyQueue.add(function() {
                proxy.proxyRequest(request, response, {
                    host: requestHost.hostname,
                    port: requestHost.port,
                    buffer: buffer
                });
            });
        } else {
            response.writeHead(500, {
                "Content-Type": "text/plain"
            });
            response.end("Proxy has not been configured for host: " + requestHost.toString());
        }
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

