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

exports["can configure server through file"] = function(test) {
    var server = startApiProxy({useConfigFile: true});
    
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
    var server = startApiProxy({cacheAge: "1000000"});
    
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
    var server = startApiProxy({cacheAge: "1000000"});
    
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

function startApiProxy(options) {
    options = options || {};
    
    var echoPort = 50999;
    var proxyPort = 50998;
    
    var httpEchoServer = httpEcho.createServer().listen(echoPort);
    
    var argv = ["--port=" + proxyPort];
    
    if (options.useConfigFile) {
        var tempFile = temp.openSync("config.json");
        fs.writeFileSync(tempFile.path, JSON.stringify({
            sites: [
                {
                    upstream: "http://localhost:" + echoPort,
                    interval: 100
                }
            ]
        }), "utf8");
        
        argv.push("-c");
        argv.push(tempFile.path);
    } else {
        argv.push("localhost:" + echoPort);
        argv.push("--interval=100");
    }
    if (options.cacheAge) {
        argv.push("--cache=" + options.cacheAge);
    }
    
    var apiProxyServer = apiProxy.app.run(argv);
    
    function stop() {
        httpEchoServer.close();
        apiProxyServer.close();
    }
    
    function timeRequest(path, options, callback) {
        if (!callback) {
            callback = options;
            options = {}
        }
        options.headers = {host: "localhost:" + echoPort};
        options.url = url(path);
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
