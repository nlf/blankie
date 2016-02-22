var Schema = require('./schema');
var Hoek = require('hoek');
var internals = {};


internals.arrayValues = [
    'childSrc',
    'connectSrc',
    'defaultSrc',
    'fontSrc',
    'formAction',
    'frameAncestors',
    'frameSrc',
    'imgSrc',
    'manifestSrc',
    'mediaSrc',
    'objectSrc',
    'pluginTypes',
    'sandbox',
    'scriptSrc',
    'styleSrc',
    'xhrSrc'
];

internals.stringValues = [
    'reportUri',
    'reflectedXss'
];


internals.directiveNames = internals.arrayValues.concat(internals.stringValues);

internals.directiveMap = {
    'childSrc': 'child-src',
    'connectSrc': 'connect-src',
    'defaultSrc': 'default-src',
    'fontSrc': 'font-src',
    'formAction': 'form-action',
    'frameAncestors': 'frame-ancestors',
    'frameSrc': 'frame-src',
    'imgSrc': 'img-src',
    'manifestSrc': 'manifest-src',
    'mediaSrc': 'media-src',
    'objectSrc': 'object-src',
    'pluginTypes': 'plugin-types',
    'reflectedXss': 'reflected-xss',
    'reportUri': 'report-uri',
    'scriptSrc': 'script-src',
    'styleSrc': 'style-src',
    'xhrSrc': 'xhr-src'
};

internals.allHeaders = [
    'Content-Security-Policy',
    'X-Content-Security-Policy',
    'X-WebKit-CSP'
];

internals.needQuotes = [
    'self',
    'none',
    'unsafe-inline',
    'unsafe-eval',
    'inline-script',
    'eval-script'
];


internals.generateIEPolicy = function (options) {

    // IE only supports the sandbox directive
    var sandboxPolicy = Hoek.clone(options).sandbox;
    return internals.generatePolicy({ sandbox: sandboxPolicy });
};


internals.generateFirefoxPolicy = function (options) {

    // connect-src -> xhr-src
    options.xhrSrc = options.connectSrc;
    delete options.connectSrc;

    // no sandbox support
    delete options.sandbox;

    // "unsafe-inline" -> "inline-script"
    // "unsafe-eval" -> "eval-script"
    options.scriptSrc = options.scriptSrc.map(function (value) {
        if (value === '\'unsafe-inline\'') {
            return '\'inline-script\'';
        }
        else if (value === '\'unsafe-eval\'') {
            return '\'eval-script\'';
        }

        return value;
    });

    // remove "unsafe-inline" and "unsafe-eval" from other directives
    internals.arrayValues.forEach(function (key) {

        if (!options[key]) {
            return false;
        }

        options[key] = options[key].filter(function (value) {

            return value !== '\'unsafe-inline\'' && value !== '\'unsafe-eval\'';
        });

        if (!options[key].length) {
            options[key] = undefined;
        }
    });

    return internals.generatePolicy(options);
};


internals.generateFirefox4Policy = function (options) {

    var policy = internals.generateFirefoxPolicy(options);

    // firefox 4 uses "allow" instead of "default-src"
    policy = policy.replace('default-src', 'allow');

    return policy;
};


internals.generatePolicy = function (options) {

    var policy = [];

    // map the camel case names to proper directive names
    // and join their values into strings
    internals.directiveNames.forEach(function (key) {

        if (!options[key]) {
            return;
        }

        var directive = internals.directiveMap[key] || key;
        if (internals.stringValues.indexOf(key) >= 0) {
            policy.push(directive + ' ' + options[key]);
        }
        else if (key === 'sandbox' && options[key] === true) {
            // it's allowed to have a sandbox directive with no value
            policy.push('sandbox');
        }
        else if (key === 'scriptSrc') {
            var nonces = Object.keys(options.nonces).map(function (nonceName) {
                return "'nonce-" + options.nonces[nonceName] + "'";
            });
            options[key].push.apply(options[key], nonces);
            policy.push(directive + ' ' + options[key].join(' '));
        }
        else {
            policy.push(directive + ' ' + options[key].join(' '));
        }
    });

    return policy.join(';');
};


internals.addHeaders = function (request, reply) {

    if (request.route.settings.plugins.blankie === false) {
        return reply.continue();
    }

    var options;

    if (request.route.settings.plugins.blankie) {
        options = internals.validateOptions(request.route.settings.plugins.blankie);

        if (options instanceof Error) {
            request.server.log(['error', 'blankie'], 'Invalid blankie configuration on route: ' + request.route.path);
            return reply.continue();
        }
    }
    else {
        options = Hoek.clone(internals.options);
    }

    var userAgent = request.plugins.scooter || {};
    var version = parseInt(userAgent.major, 10);
    var headerName = 'Content-Security-Policy';
    var policy;

    options.nonces = request.plugins.blankie.nonces || {};

    switch (userAgent.family) {
        case 'Chrome':
            if (version >= 14 && version <= 25) {
                headerName = 'X-WebKit-CSP';
            }
            policy = internals.generatePolicy(options);

            break;
        case 'Firefox':
            if (version === 4) {
                headerName = 'X-Content-Security-Policy';
                policy = internals.generateFirefox4Policy(options);
            }
            else if (version >= 5 && version <= 23) {
                headerName = 'X-Content-Security-Policy';
                policy = internals.generateFirefoxPolicy(options);
            }
            else {
                policy = internals.generatePolicy(options);
            }

            break;
        case 'IE':
            headerName = 'X-Content-Security-Policy';
            policy = internals.generateIEPolicy(options);

            break;
        case 'Safari':
            if (version === 6 ||
               (version === 5 && options.oldSafari)) {
                headerName = 'X-WebKit-CSP';
            }
            policy = internals.generatePolicy(options);

            break;
        default:
            policy = internals.generatePolicy(options);

            break;
    }

    if (options.reportOnly) {
        headerName += '-Report-Only';
    }

    if (!request.response.isBoom) {
        request.response.headers[headerName] = policy;
    }
    else {
        request.response.output.headers[headerName] = policy;
    }

    return reply.continue();
};


internals.validateOptions = function (options) {

    var result;

    Schema.validate(options, function (err, value) {

        if (err) {
            result = err;
            return;
        }

        internals.arrayValues.forEach(function (key) {

            if (value[key] !== undefined) {
                if (key === 'sandbox' && value[key] === true) {
                    return;
                }

                value[key] = value[key].map(function (val) {

                    if (internals.needQuotes.indexOf(val) !== -1) {
                        return '\'' + val + '\'';
                    }

                    return val;
                });
            }
        });

        result = value;
    });

    return result;
};


internals.onRequest = function (request, reply) {
    request.plugins.blankie = {};
    return reply.continue();
};

exports.register = function (server, options, next) {

    server.dependency('scooter');

    internals.options = internals.validateOptions(options);

    if (internals.options instanceof Error) {
        return next(internals.options);
    }

    server.ext('onPreResponse', internals.addHeaders);
    server.ext('onRequest', internals.onRequest);
    return next();
};


exports.register.attributes = {
    pkg: require('../package.json')
};
