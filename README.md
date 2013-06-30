# node-api-proxy

A reverse proxy designed for use with rate limited APIs.

## Installation

    npm install http-api-proxy
    
## Usage

Any requests to the proxy must have the `Host` header set to the upstream host.
Any requests to an upstream host that the proxy has not been configured for will return errors.

To start a proxy:

    http-api-proxy <hostname>[:<port>] --interval=<interval> --port=<port> [--cache=<cache-age>]

This starts an HTTP server on port `<port>`.
All requests to that server are delegated to `<hostname>:<port>`,
but ensuring that at least `<interval>` millseconds elapse between each request.

Alternatively, you can use a configuration file.
This allows the proxy to be used for multiple upstreams.

    http-api-proxy -c <config-file.json> --port=<port> [--cache=<cache-age>]
    
## Examples

Suppose you want to access a particular API at most once per second:

    http-api-proxy example.com --interval=1000 --port=8080

Or using a configuration file:

    http-api-proxy -c config.json --port=8080

where config.json looks like:

    {
        "sites": [
            {
                "upstream": "example.com",
                "interval": 1000
            }
        ]
    }
