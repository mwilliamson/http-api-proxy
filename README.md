# node-api-proxy

A reverse proxy designed for use with rate limited APIs.

## Installation

    npm install http-api-proxy
    
## Usage

To start a proxy:

    http-api-proxy <hostname>[:<port>] --interval=<interval> --port=<port>

This starts an HTTP server on port `<port>`.
All requests to that server are delegated to `<hostname>:<port>`,
but ensuring that at least `<interval>` millseconds elapse between each request.
    
## Examples

Suppose you want to access a particular API at most once per second:

    http-api-proxy http://example.com/api --interval=1000
