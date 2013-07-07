# node-api-proxy

A reverse proxy designed for use with rate limited APIs.

## Installation

    npm install http-api-proxy
    
## Usage

Any requests to the proxy must have the `Host` header set to the upstream host.
Any requests to an upstream host that the proxy has not been configured for will return errors.

To start a proxy:

    http-api-proxy -c <config-file.json>

The config file should be a JSON file with the following properties:

* `httpPort`: The port on which the HTTP proxy server should listen.
  The server on this port will only proxy sites where the protocol is HTTP.
* `httpsPort` (optional): If set, listen on this port and proxy sites where the protocol is HTTPS.
  Note that the proxy server itself still uses HTTP rather than HTTPS.
* `sites`: A list of sites that the proxy can delegate requests to.
  If a request is made for a site that is not referenced here,
  the proxy will respond with a 500 error.
  Each element should have the following properties:
  * `upstream`: The host for the upstream site, such as `http://example.com` or `http://example.com:8080`.
  * `interval`: Ensure that at least `interval` milliseconds elapse between each request to this site.
* `cacheAge` (optional): If set, successful GET requests will be cached for `cacheAge` milliseconds.
* `cachePath` (optional): If set, the specified path will be used to persist the cache.

## Examples

Suppose you want to access a particular API at most once per second:

    http-api-proxy -c config.json

where config.json looks like:

    {
        "sites": [
            {
                "upstream": "http://example.com",
                "interval": 1000
            }
        ],
        "httpPort": 8080
    }
    
Then, to use the proxy:

    curl http://localhost:8080/ -H"Host: example.com"

If you wanted to also proxy a site that is served over HTTPS:

    {
        "sites": [
            {
                "upstream": "http://example.com",
                "interval": 1000
            },
            {
                "upstream": "https://secret.example.com",
                "interval": 1000
            }
        ],
        "httpPort": 8080,
        "httpsPort": 8081
    }

And to use the proxy:

    curl https://localhost:8081/ -H"Host: secret.example.com"
