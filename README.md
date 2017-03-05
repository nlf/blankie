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

server.register([Scooter, {
    register: Blankie,
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

* `childSrc`: Values for `child-src` directive.
* `connectSrc`: Values for the `connect-src` directive. Defaults `'self'`.
* `defaultSrc`: Values for the `default-src` directive. Defaults to `'none'`.
* `fontSrc`: Values for the `font-src` directive.
* `formAction`: Values for the `form-action` directive.
* `frameAncestors`: Values for the `frame-ancestors` directive.
* `frameSrc`: Values for the `frame-src` directive.
* `imgSrc`: Values for the `image-src` directive. Defaults to `'self'`.
* `manifestSrc`: Values for the `manifest-src` directive.
* `mediaSrc`: Values for the `media-src` directive.
* `objectSrc`: Values for the `object-src` directive.
* `oldSafari`: Force enabling buggy CSP for Safari 5.
* `pluginTypes`: Values for the `plugin-types` directive.
* `reflectedXss`: Value for the `reflected-xss` directive. Must be one of `'allow'`, `'block'` or `'filter'`.
* `reportOnly`: Append '-Report-Only' to the name of the CSP header to enable report only mode.
* `reportUri`: Value for the `report-uri` directive. This should be the path to a route that accepts CSP violation reports.
* `requireSriFor`: Value for `require-sri-for` directive.
* `sandbox`: Values for the `sandbox` directive. May be a boolean or one of `'allow-forms'`, `'allow-same-origin'`, `'allow-scripts'` or `'allow-top-navigation'`.
* `scriptSrc`: Values for the `script-src` directive. Defaults to `'self'`. NOTE: when `generateNonces` is `true` or `script`, `'unsafe-inline'` is not allowed here.
* `styleSrc`: Values for the `style-src` directive. Defaults to `'self'`.
* `generateNonces`: Whether or not to automatically generate nonces. Defaults to `true`. May be a boolean or one of `'script'` or `'style'`. When enabled your templates will have `script-nonce` and/or `style-nonce` automatically added to their context.
