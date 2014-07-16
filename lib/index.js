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
    'frameSrc': 'frame-src'
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


internals.generateIEPolicy = function () {

    // IE only supports the sandbox directive
    var sandboxOptions = Hoek.clone(internals.options).sandbox;
    return internals.generatePolicy({ sandbox: sandboxOptions });
};


internals.generateFirefoxPolicy = function () {

    var options = Hoek.clone(internals.options);

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

        if (!options.hasOwnProperty(key)) {
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


internals.generateFirefox4Policy = function () {

    var options = internals.generateFirefoxPolicy();

    // firefox 4 uses "allow" instead of "default-src"
    options = options.replace('default-src', 'allow');

    return options;
};


internals.generatePolicy = function (opts) {

    var options = Hoek.clone(opts || internals.options);
    var policy = [];

    // map the camel case names to proper directive names
    // and join their values into strings
    internals.directiveNames.forEach(function (key) {

        if (!options.hasOwnProperty(key)) {
            return;
        }

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


internals.addHeaders = function (request, next) {

    var userAgent = request.plugins.scooter;
    var headerName = 'Content-Security-Policy';
    var policy;

    switch (userAgent.family) {
        case 'Chrome':
            if (userAgent.satisfies('>=14.0.0 <=25.0.0')) {
                headerName = 'X-WebKit-CSP';
            }
            policy = internals.generatePolicy();

            break;
        case 'Firefox':
            if (userAgent.satisfies('^4.0.0')) {
                headerName = 'X-Content-Security-Policy';
                policy = internals.generateFirefox4Policy();
            }
            else if (userAgent.satisfies('>=5.0.0  <=23.0.0')) {
                headerName = 'X-Content-Security-Policy';
                policy = internals.generateFirefoxPolicy();
            }
            else {
                policy = internals.generatePolicy();
            }

            break;
        case 'IE':
            headerName = 'X-Content-Security-Policy';
            policy = internals.generateIEPolicy();

            break;
        case 'Safari':
            if (userAgent.satisfies('^6.0.0') ||
               (userAgent.satisfies('^5.0.0') && internals.options.oldSafari)) {
                headerName = 'X-WebKit-CSP';
            }
            policy = internals.generatePolicy();

            break;
        default:
            policy = internals.generatePolicy();

            break;
    }

    if (internals.options.reportOnly) {
        headerName += '-Report-Only';
    }

    if (!request.response.isBoom) {
        request.response.headers[headerName] = policy;
    }

    return next();
};


exports.register = function (plugin, options, next) {

    plugin.dependency('scooter');

    Schema.validate(options, function (err, value) {
        
        if (err) {
            return next(err);
        }

        internals.arrayValues.forEach(function (key) {

            if (value[key] !== undefined) {
                if (key === 'sandbox' && value[key] === true) {
                    return;
                }

                if (!Array.isArray(value[key])) {
                    value[key] = value[key] ? [value[key]] : undefined;
                }

                value[key] = value[key].map(function (val) {

                    if (internals.needQuotes.indexOf(val) !== -1) {
                        return '\'' + val + '\'';
                    }

                    return val;
                });
            }
        });

        internals.options = value;
    });

    plugin.ext('onPreResponse', internals.addHeaders);
    return next();
};


exports.register.attributes = {
    pkg: require('../package.json')
};
