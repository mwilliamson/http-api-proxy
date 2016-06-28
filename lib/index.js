var http = require('http');
var path = require("path");
var url = require("url");

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
    };
}

function isProtocol(protocol) {
    return function(site) {
        return protocol + ":" === site.upstream.protocol;
    };
}

function createServer(sites, protocol, options) {
    options = options || {};
    var isHttps = protocol === "https";
    
    var proxyQueues = new ProxyQueues(sites, options.defaultInterval);
    
    var proxy = new httpProxy.RoutingProxy({target: {https: isHttps}});
    
    var proxyMiddleware = function(request, response) {
        // HACK: work-around for a bug in http-proxy
        // Send path in req.path and not the url: https://github.com/nodejitsu/node-http-proxy/pull/416
        request.url = url.parse(request.url).path;
        var requestHost = hosts.parseHost(protocol, request.headers.host);
        var proxyQueue = proxyQueues.forHost(requestHost);
        
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
        var cachePath = options.cachePath;
        if (options.cachePath) {
            var backendCachePath = path.join(cachePath, protocol + ".sqlite");
            mkdirp.sync(path.dirname(backendCachePath));
        }
        app.use(connectResponseCache({
            maxAge: options.cacheAge,
            cachePath: cachePath,
            backend: {
                path: backendCachePath
            }
        }));
    }
    
    app.use(proxyMiddleware);
    
    return http.createServer(app);
}

function ProxyQueues(sites, defaultInterval) {
    this._defaultInterval = defaultInterval;
    var queues = this._queues = {};
    
    sites.forEach(function(site) {
        var host = new hosts.Host(site.upstream);
        queues[host.toString()] = rateLimit.createQueue({interval: site.interval});
    });
}

ProxyQueues.prototype.forHost = function(host) {
    var key = host.toString();
    if (!this._queues[key]) {
        if (this._defaultInterval || this._defaultInterval === 0) {
            this._queues[key] = rateLimit.createQueue({interval: this._defaultInterval});
        } else {
            return null;
        }
    }
    return this._queues[key];
};
