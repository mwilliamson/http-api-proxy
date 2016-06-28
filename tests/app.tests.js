var fs = require("fs");

var request = require("request");
var temp = require("temp");

var apiProxy = require("../");
var httpEcho = require("./http-echo");

exports["requests are rate limited"] = function(test) {
    var server = startApiProxy();
    
    server.timeRequest("/", function(error, firstTime) {
        test.ifError(error);
        server.timeRequest("/", function(error, secondTime) {
            test.ifError(error);
            test.ok(secondTime - firstTime >= 98, "gap was: " + (secondTime - firstTime));
            server.stop();
            test.done();
        });
    });
};

exports["cached requests are not rate limited"] = function(test) {
    var server = startApiProxy({cacheAge: 1000000});
    
    server.timeRequest("/", function(error, firstTime) {
        test.ifError(error);
        server.timeRequest("/", function(error, secondTime) {
            test.ifError(error);
            test.equal(firstTime, secondTime);
            server.stop();
            test.done();
        });
    });
};

exports["different URLs are separately cached"] = function(test) {
    var server = startApiProxy({cacheAge: 1000000});
    
    server.timeRequest("/first", function(error, firstTime, url) {
        test.ifError(error);
        test.equal(url, "/first");
        server.timeRequest("/second", function(error, secondTime, url) {
            test.ifError(error);
            test.equal(url, "/second");
            test.ok(secondTime - firstTime >= 98, "gap was: " + (secondTime - firstTime));
            server.stop();
            test.done();
        });
    });
};

exports["different URLs are separately cached"] = function(test) {
    var server = startApiProxy({cacheAge: 1000000});
    
    server.timeRequest("/first", function(error, firstTime, url) {
        test.ifError(error);
        test.equal(url, "/first");
        server.timeRequest("/second", function(error, secondTime, url) {
            test.ifError(error);
            test.equal(url, "/second");
            test.ok(secondTime - firstTime >= 98, "gap was: " + (secondTime - firstTime));
            server.stop();
            test.done();
        });
    });
};

exports["full URL is not passed to upstream when full URL is specified in proxy request"] = function(test) {
    var server = startApiProxy({cacheAge: 1000000});
    
    server.timeRequest("/first", {proxy: true}, function(error, firstTime, url) {
        test.ifError(error);
        test.equal(url, "/first");
        server.timeRequest("/second", function(error, secondTime, url) {
            test.ifError(error);
            test.equal(url, "/second");
            test.ok(secondTime - firstTime >= 98, "gap was: " + (secondTime - firstTime));
            server.stop();
            test.done();
        });
    });
};

function startApiProxy(options) {
    options = options || {};
    
    var echoPort = 50999;
    var proxyPort = 50998;
    
    var httpEchoServer = httpEcho.createServer().listen(echoPort);
    
    var tempFile = temp.openSync("config.json");
    var cachePath = temp.mkdirSync();
    var config = {
        sites: [
            {
                upstream: "http://localhost:" + echoPort,
                interval: 100
            }
        ],
        httpPort: proxyPort,
        cachePath: cachePath
    };
    if (options.cacheAge) {
        config["cacheAge"] = options.cacheAge;
    }
    fs.writeFileSync(tempFile.path, JSON.stringify(config), "utf8");
    
    var argv = ["-c", tempFile.path];
    
    var apiProxyServer = apiProxy.app.run(argv);
    
    function stop() {
        httpEchoServer.close();
        apiProxyServer.close();
    }
    
    function timeRequest(path, options, callback) {
        if (!callback) {
            callback = options;
            options = {};
        }
        options.headers = {host: "localhost:" + echoPort};
        
        if (options.proxy) {
            options.proxy = url("/");
            options.url = "http://localhost:" + echoPort + path;
        } else {
            options.url = url(path);
        }
        request(options, function(error, response, body) {
            var jsonBody = JSON.parse(body);
            callback(error, jsonBody.time, jsonBody.url);
        });
    }
    
    function url(path) {
        return "http://localhost:" + proxyPort + path;
    }
    
    return {
        stop: stop,
        timeRequest: timeRequest
    };
}
