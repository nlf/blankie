## blankie

A CSP plugin for [hapi](https://github.com/hapijs/hapi).

### Usage

This plugin depends on [scooter](https://github.com/hapijs/scooter) to function.

To use it:

```javascript
'use strict';

const Hapi = require('@hapi/hapi');
const Blankie = require('blankie');
const Scooter = require('@hapi/scooter');

const internals = {};

const server = Hapi.server();

internals.init = async () => {

    await server.register([Scooter, {
        plugin: Blankie,
        options: {} // specify options here
    }]);

    await server.start();
};

internals.init().catch((err) => {

    throw err;
});
```

Options may also be set on a per-route basis:

```javascript
'use strict';

const Hapi = require('@hapi/hapi');
const Blankie = require('blankie');
const Scooter = require('@hapi/scooter');

const server = Hapi.server();

server.route({
    method: 'GET',
    path: '/something',
    config: {
        handler: (request, h) => {

            return 'these settings are changed';
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

* `baseUri`: Values for `base-uri` directive. Defaults `'self'`.
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
* `reportTo`: Name of the group defined in the `Report-to` header. This replaces `report-uri` in browsers that already support it.
* `requireSriFor`: Value for `require-sri-for` directive.
* `sandbox`: Values for the `sandbox` directive. May be a boolean or one of `'allow-forms'`, `'allow-same-origin'`, `'allow-scripts'` or `'allow-top-navigation'`.
* `scriptSrc`: Values for the `script-src` directive. Defaults to `'self'`.
* `styleSrc`: Values for the `style-src` directive. Defaults to `'self'`.
* `workerSrc`: Values for the `worker-src` directive. Defaults to `'self'`.
* `generateNonces`: Whether or not to automatically generate nonces. Defaults to `true`. May be a boolean or one of `'script'` or `'style'`. When enabled your templates rendered through [vision](https://github.com/hapijs/vision) will have `script-nonce` and/or `style-nonce` automatically added to their context, additionally `request.plugins.blankie.nonces` will contain one or both of the `'script'` and `'style'` properties containing these values for use outside of vision.
