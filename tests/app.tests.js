var request = require("request");

var apiProxy = require("../");
var httpEcho = require("./http-echo");

exports["requests are rate limited"] = function(test) {
    var server = startApiProxy();
    
    server.timeRequest("/", function(error, firstTime) {
        test.ifError(error);
        server.timeRequest("/", function(error, secondTime) {
            test.ifError(error);
            test.ok(secondTime - firstTime >= 100, "gap was: " + (secondTime - firstTime));
            server.stop();
            test.done();     
        });
    });
};

function startApiProxy() {
    var echoPort = 50999;
    var proxyPort = 50998;
    var httpEchoServer = httpEcho.createServer().listen(echoPort);
    
    var apiProxyServer = apiProxy.app.run([
        "localhost:" + echoPort,
        "--interval=100",
        "--port=" + proxyPort
    ]);
    
    function stop() {
        httpEchoServer.close();
        apiProxyServer.close();
    }
    
    function timeRequest(path, options, callback) {
        if (!callback) {
            callback = options;
            options = {}
        }
        request(url(path), options, function(error, response, body) {
            callback(error, JSON.parse(body).time);
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
