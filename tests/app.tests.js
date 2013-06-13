var request = require("request");

var apiProxy = require("../");
var httpEcho = require("./http-echo");

var echoPort = 50999;
var proxyPort = 50998;

exports["requests are rate limited"] = function(test) {
    var httpEchoServer = httpEcho.createServer().listen(echoPort);
    
    var apiProxyServer = apiProxy.app.run([
        "localhost:" + echoPort,
        "--interval=100",
        "--port=" + proxyPort
    ]);
    
    function timeRequest(callback) {
        request("http://localhost:" + proxyPort, function(error, response, body) {
            callback(JSON.parse(body).time);
        });
    }
    
    timeRequest(function(firstTime) {
        timeRequest(function(secondTime) {
            test.ok(secondTime - firstTime >= 100);
            httpEchoServer.close();
            apiProxyServer.close();
            test.done();     
        });
    });
};
