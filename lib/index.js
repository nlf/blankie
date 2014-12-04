var Defaults = require('./defaults');
var Schema = require('./schema');
var Hoek = require('hoek');
var internals = {};


internals.arrayValues = [
    'defaultSrc',
    'scriptSrc',
    'styleSrc',
    'imgSrc',
    'connectSrc',
    'fontSrc',
    'objectSrc',
    'mediaSrc',
    'frameSrc',
    'xhrSrc',
    'sandbox'
];

internals.directiveNames = internals.arrayValues.concat(['reportUri']);

internals.directiveMap = {
    'defaultSrc': 'default-src',
    'scriptSrc': 'script-src',
    'styleSrc': 'style-src',
    'imgSrc': 'img-src',
    'connectSrc': 'connect-src',
    'xhrSrc': 'xhr-src',
    'fontSrc': 'font-src',
    'objectSrc': 'object-src',
    'mediaSrc': 'media-src',
    'frameSrc': 'frame-src',
    'reportUri': 'report-uri'
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
    if (options.scriptSrc) {
        options.scriptSrc = options.scriptSrc.map(function (value) {
            if (value === '\'unsafe-inline\'') {
                return '\'inline-script\'';
            }
            else if (value === '\'unsafe-eval\'') {
                return '\'eval-script\'';
            }

            return value;
        });
    }

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
        if (key === 'reportUri') {
            policy.push(directive + ' ' + options[key]);
        }
        else if (key === 'sandbox' && options[key] === true) {
            // it's allowed to have a sandbox directive with no value
            policy.push('sandbox');
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

        if (!Object.keys(options).filter(function (key) {

            return key !== 'oldSafari' && key !== 'reportOnly';
        }).length) {
            value = Hoek.applyToDefaults(Defaults, value);
        }

        internals.arrayValues.forEach(function (key) {

            if (value[key] !== undefined) {
                if (key === 'sandbox' && value[key] === true) {
                    return;
                }

                if (!Array.isArray(value[key])) {
                    value[key] = [value[key]];
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
