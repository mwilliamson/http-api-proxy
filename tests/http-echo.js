var http = require("http");

exports.createServer = function() {
    return http.createServer(function(request, response) {
        response.writeHead(200, {
            "Content-Type": "application/json"
        });
        response.write(JSON.stringify(describeRequest(request), null, 4));
        response.end("\n");
    });
}

function describeRequest(request) {
    return {
        headers: request.headers,
        url: request.url,
        method: request.method,
        httpVersion: request.httpVersion,
        time: new Date().getTime()
    };
}
