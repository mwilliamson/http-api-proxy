var request = require("request");

var apiProxy = require("../");


exports["500 error if site in request has not been configured"] = function(test) {
    var proxyServer = apiProxy.createServer([]);
    
    proxyServer.listen(50998);
    
    var requestOptions = {
        url: "http://localhost:50998/",
        headers: {host: "eg.com"}
    };
    
    request(requestOptions, function(error, response, body) {
        test.equal(500, response.statusCode);
        test.equal("Proxy has not been configured for host: eg.com", body);
        proxyServer.close();
        test.done();
    });
};
