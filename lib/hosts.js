exports.parseHost = parseHost;


var defaultHttpPort = 80;

function parseHost(host) {
    var hostParts = host.split(":");
    var upstream;
    if (hostParts.length === 1) {
        return new Host(host, defaultHttpPort);
    } else {
        return new Host(hostParts[0], parseInt(hostParts[1], 10));
    }
}


function Host(hostname, port) {
    this.hostname = hostname;
    this.port = port;
}

Host.prototype.toString = function() {
    if (this.port === defaultHttpPort) {
        return this.hostname;
    } else {
        return this.hostname + ":" + this.port;
    }
};
