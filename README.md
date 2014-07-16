## blankie

A CSP plugin for [hapi](https://github.com/spumko/hapi).

### Usage

This plugin depends on [scooter](https://github.com/spumko/scooter) to function.

To use it:

```javascript
var Hapi = require('hapi');
var Blankie = require('blankie');
var Scooter = require('scooter');

var server = new Hapi.Server();

server.pack.register([Scooter, {
    plugin: Blankie,
    options: {} // specify options here
}], function (err) {
    
    if (err) {
        throw err;
    }

    server.start();
});
```

Options may also be set on a per-route basis:

```javascript
var Hapi = require('hapi');
var Blankie = require('blankie');
var Scooter = require('scooter');

var server = new Hapi.Server();

server.route({
    method: 'GET',
    path: '/something',
    config: {
        handler: function (request, reply) {

            reply('these settings are changed');
        },
        plugins: {
            blankie: {
                scriptSrc: 'self'
            }
        }
    }
});
```

Note that this setting will *NOT* be merged with your server-wide settings.

You may also set `config.plugins.blankie` equal to `false` on a route to disable CSP headers completely for that route.

### Options

* `defaultSrc`: Values for the `default-src` directive. Defaults to `'none'`.
* `scriptSrc`: Values for the `script-src` directive. Defaults to `'self'`.
* `styleSrc`: Values for the `style-src` directive. Defaults to `'self'`.
* `imgSrc`: Values for the `image-src` directive. Defaults to `'self'`.
* `connectSrc`: Values for the `connect-src` directive. Defaults `'self'`.
* `fontSrc`: Values for the `font-src` directive.
* `objectSrc`: Values for the `object-src` directive.
* `mediaSrc`: Values for the `media-src` directive.
* `frameSrc`: Values for the `frame-src` directive.
* `sandbox`: Values for the `sandbox` directive.
* `reportUri`: Value for the `report-uri` directive. This should be the path to a route that accepts CSP violation reports.
* `reportOnly`: Append '-Report-Only' to the name of the CSP header to enable report only mode.
* `oldSafari`: Force enabling buggy CSP for Safari 5.
