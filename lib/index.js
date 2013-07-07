var http = require('http');
var path = require("path");

var connect = require("connect");
var httpProxy = require('http-proxy');
var rateLimit = require("rate-limit");
var connectResponseCache = require("connect-response-cache");
var mkdirp = require("mkdirp");

var hosts = require("./hosts");

exports.startServer = startServer;
exports.app = require("./app");

function startServer(sites, options) {
    var httpServer = createServerForProtocol("http");
        
    var httpsServer;
    if (options.httpsPort) {
        httpsServer = createServerForProtocol("https");
    }
    
    function createServerForProtocol(protocolName) {
        var relevantSites = sites.filter(isProtocol(protocolName));
        return createServer(relevantSites, protocolName, options)
            .listen(options[protocolName + "Port"]);
    }
    
    return {
        close: function() {
            httpServer.close();
            if (httpsServer) {
                httpsServer.close();
            }
        }
    }
}

function isProtocol(protocol) {
    return function(site) {
        return protocol + ":" === site.upstream.protocol;
    };
}

function createServer(sites, protocol, options) {
    options = options || {};
    var isHttps = protocol === "https";
    
    var proxyQueues = {};
    
    sites.forEach(function(site) {
        var host = new hosts.Host(site.upstream);
        proxyQueues[host.toString()] = rateLimit.createQueue({interval: site.interval});
    });
    
    var proxy = new httpProxy.RoutingProxy({target: {https: isHttps}});
    
    var proxyMiddleware = function(request, response) {
        var requestHost = hosts.parseHost(protocol, request.headers.host);
        var proxyQueue = proxyQueues[requestHost.toString()];
        
        if (proxyQueue) {
            var buffer = request._apiProxyBuffer;
            proxyQueue.add(function() {
                proxy.proxyRequest(request, response, {
                    host: requestHost.hostname,
                    port: requestHost.port,
                    buffer: buffer,
                    https: isHttps
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
        var cachePath;
        if (options.cachePath) {
            cachePath = path.join(options.cachePath, protocol + ".sqlite");
            mkdirp.sync(path.dirname(cachePath));
        }
        app.use(connectResponseCache({
            maxAge: options.cacheAge,
            backend: {
                path: cachePath
            }
        }));
    }
    
    app.use(proxyMiddleware);
    
    return http.createServer(app);
}

