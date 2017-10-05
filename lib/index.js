var Crypto = require('crypto');
var Schema = require('./schema');
var Hoek = require('hoek');
var internals = {};


internals.arrayValues = [
    'baseUri',
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
    'requireSriFor',
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
    'baseUri': 'base-uri',
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
    'requireSriFor': 'require-sri-for',
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
    'eval-script',
    'strict-dynamic'
];

internals.nonceShouldBeGenerated = function (options, key) {

    var keyToConfigMap = {
        scriptSrc: 'script',
        styleSrc: 'style'
    };

    return options.generateNonces === true ||  options.generateNonces === keyToConfigMap[key];
};


internals.generateNonce = function () {

    var bytes;
    try {
        bytes = Crypto.randomBytes(16);
    }
    catch (e) {
        bytes = Crypto.pseudoRandomBytes(16);
    }

    return bytes.toString('hex');
};


internals.generateIEPolicy = function (options, request) {

    // IE only supports the sandbox directive
    var sandboxPolicy = Hoek.clone(options).sandbox;
    return internals.generatePolicy({ sandbox: sandboxPolicy }, request);
};


internals.generateFirefoxPolicy = function (options, request) {

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

    return internals.generatePolicy(options, request);
};


internals.generateFirefox4Policy = function (options, request) {

    var policy = internals.generateFirefoxPolicy(options, request);

    // firefox 4 uses "allow" instead of "default-src"
    policy = policy.replace('default-src', 'allow');

    return policy;
};


internals.generatePolicy = function (options, request) {

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
            return;
        }

        if (key === 'sandbox' && options[key] === true) {
            // it's allowed to have a sandbox directive with no value
            policy.push('sandbox');
            return;
        }

        if ((key === 'scriptSrc' || key === 'styleSrc') && internals.nonceShouldBeGenerated(options, key)) {

            var nonce = internals.generateNonce();
            var sources = Hoek.clone(options[key]);
            sources.push('\'nonce-' + nonce + '\'');
            policy.push(directive + ' ' + sources.join(' '));
            if (request.response.variety === 'view') {
                request.response.source.context = Hoek.applyToDefaults({ nonce: nonce }, request.response.source.context || {});
                request.response.source.context[key.slice(0, -3) + '-nonce'] = nonce;
            }
            return;
        }

        policy.push(directive + ' ' + options[key].join(' '));
    });

    return policy.join(';');
};


internals.addHeaders = function (request, reply) {

    var response = request.response;

    var contentType = (response.headers || response.output.headers)['content-type'];

    if (request.route.settings.plugins.blankie === false ||
        (contentType && contentType !== 'text/html')) {

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

    switch (userAgent.family) {
        case 'Chrome':
            if (version >= 14 && version <= 25) {
                headerName = 'X-WebKit-CSP';
            }
            policy = internals.generatePolicy(options, request);

            break;
        case 'Firefox':
            if (version === 4) {
                headerName = 'X-Content-Security-Policy';
                policy = internals.generateFirefox4Policy(options, request);
            }
            else if (version >= 5 && version <= 23) {
                headerName = 'X-Content-Security-Policy';
                policy = internals.generateFirefoxPolicy(options, request);
            }
            else {
                policy = internals.generatePolicy(options, request);
            }

            break;
        case 'IE':
            headerName = 'X-Content-Security-Policy';
            policy = internals.generateIEPolicy(options, request);

            break;
        case 'Safari':
            if (version === 6 ||
               (version === 5 && options.oldSafari)) {
                headerName = 'X-WebKit-CSP';
            }
            policy = internals.generatePolicy(options, request);

            break;
        default:
            policy = internals.generatePolicy(options, request);

            break;
    }

    if (options.reportOnly) {
        headerName += '-Report-Only';
    }

    if (!response.isBoom) {
        response.headers[headerName] = policy;
    }
    else {
        response.output.headers[headerName] = policy;
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


exports.register = function (server, options, next) {

    server.dependency('scooter');

    internals.options = internals.validateOptions(options);

    if (internals.options instanceof Error) {
        return next(internals.options);
    }

    server.ext('onPreResponse', internals.addHeaders);
    return next();
};


exports.register.attributes = {
    pkg: require('../package.json')
};
