exports.parseHost = parseHost;
exports.Host = Host;


function parseHost(protocol, host) {
    var hostParts = host.split(":");
    var upstream = {
        protocol: protocol,
        hostname: hostParts[0]
    };
    
    if (hostParts.length !== 1) {
        upstream.port = parseInt(hostParts[1], 10);
    }
    return new Host(upstream);
}


function Host(options) {
    this.protocol = options.protocol;
    this.hostname = options.hostname;
    if (options.port) {
        this.port = options.port;
    } else {
        this.port = defaultPort(options.protocol);
    }
}

Host.prototype.toString = function() {
    if (this.port === defaultPort(this.protocol)) {
        return this.hostname;
    } else {
        return this.hostname + ":" + this.port;
    }
};

function defaultPort(protocol) {
    return {
        http: 80,
        https: 443
    }[protocol];
}
