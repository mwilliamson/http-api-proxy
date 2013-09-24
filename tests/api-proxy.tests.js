var request = require("request");

var apiProxy = require("../");


exports["500 error if site in request has not been configured"] = function(test) {
    var proxyServer = apiProxy.startServer([], {httpPort: 50998});
    
    var requestOptions = {
        url: "http://localhost:50998/",
        headers: {host: "example.com"}
    };
    
    request(requestOptions, function(error, response, body) {
        test.equal(500, response.statusCode);
        test.equal("Proxy has not been configured for host: example.com", body);
        proxyServer.close();
        test.done();
    });
};

exports["default interval is used if set and site in request has not been configured"] = function(test) {
    var proxyServer = apiProxy.startServer([], {httpPort: 50998, defaultInterval: 1000});
    
    var requestOptions = {
        url: "http://localhost:50998/",
        headers: {host: "example.com"}
    };
    
    request(requestOptions, function(error, response, body) {
        test.equal(200, response.statusCode);
        proxyServer.close();
        test.done();
    });
};
