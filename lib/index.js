'use strict';

const Crypto = require('crypto');
const Schema = require('./schema');
const Hoek = require('hoek');

const internals = {};


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

internals.keyToConfigMap = {
    scriptSrc: 'script',
    styleSrc: 'style'
};

internals.nonceShouldBeGenerated = function (options, key) {

    return options.generateNonces === true || options.generateNonces === internals.keyToConfigMap[key];
};


internals.generateNonce = function () {

    let bytes;
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
    const sandboxPolicy = Hoek.clone(options).sandbox;
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
    options.scriptSrc = options.scriptSrc.map((value) => {

        if (value === '\'unsafe-inline\'') {
            return '\'inline-script\'';
        }
        else if (value === '\'unsafe-eval\'') {
            return '\'eval-script\'';
        }

        return value;
    });

    // remove "unsafe-inline" and "unsafe-eval" from other directives
    internals.arrayValues.forEach((key) => {

        if (!options[key]) {
            return false;
        }

        options[key] = options[key].filter((value) => {

            return value !== '\'unsafe-inline\'' && value !== '\'unsafe-eval\'';
        });

        if (!options[key].length) {
            options[key] = undefined;
        }
    });

    return internals.generatePolicy(options, request);
};


internals.generateFirefox4Policy = function (options, request) {

    let policy = internals.generateFirefoxPolicy(options, request);

    // firefox 4 uses "allow" instead of "default-src"
    policy = policy.replace('default-src', 'allow');

    return policy;
};


internals.generatePolicy = function (options, request) {

    const policy = [];

    // map the camel case names to proper directive names
    // and join their values into strings
    internals.directiveNames.forEach((key) => {

        if (!options[key]) {
            return;
        }

        const directive = internals.directiveMap[key] || key;
        if (internals.stringValues.indexOf(key) >= 0) {
            policy.push(`${directive} ${options[key]}`);
            return;
        }

        if (key === 'sandbox' && options[key] === true) {
            // it's allowed to have a sandbox directive with no value
            policy.push('sandbox');
            return;
        }

        if ((key === 'scriptSrc' || key === 'styleSrc') && internals.nonceShouldBeGenerated(options, key)) {

            const nonce = request.plugins.blankie ? request.plugins.blankie.nonces[internals.keyToConfigMap[key]] : internals.generateNonce();
            const sources = Hoek.clone(options[key]);
            sources.push(`'nonce-${nonce}'`);
            policy.push(`${directive} ${sources.join(' ')}`);
            if (request.response.variety === 'view') {
                request.response.source.context = Hoek.applyToDefaults({ nonce }, request.response.source.context || {});
                request.response.source.context[`${key.slice(0, -3)}-nonce`] = nonce;
            }

            return;
        }

        policy.push(`${directive} ${options[key].join(' ')}`);
    });

    return policy.join(';');
};


internals.attachNonces = function (request, h) {

    if (request.method === 'options' ||
        request.route.settings.plugins.blankie === false) {

        return h.continue;
    }

    let options;

    if (request.route.settings.plugins.blankie) {
        options = internals.validateOptions(request.route.settings.plugins.blankie);

        if (options instanceof Error) {
            request.server.log(['error', 'blankie'], `Invalid blankie configuration on route: ${request.route.path}`);
            return h.continue;
        }
    }
    else if (internals.cspCallback) {
        options = internals.cspCallback(request);

        options = internals.validateOptions(options);
        if (options instanceof Error) {
            request.server.log(['error', 'blankie'], 'Invalid blankie configuration from CSP Callback');
            return h.continue;
        }
    }
    else {
        options = Hoek.clone(internals.options);
    }

    ['scriptSrc', 'styleSrc'].forEach((key) => {

        if (internals.nonceShouldBeGenerated(options, key)) {

            const nonce = internals.generateNonce();
            request.plugins.blankie = Object.assign({}, request.plugins.blankie);
            request.plugins.blankie.nonces = Object.assign({}, request.plugins.blankie.nonces);
            request.plugins.blankie.nonces[internals.keyToConfigMap[key]] = nonce;
        }
    });

    return h.continue;
};


internals.addHeaders = function (request, h) {

    const contentType = (request.response.headers || request.response.output.headers)['content-type'];

    if (request.method === 'options' ||
        request.route.settings.plugins.blankie === false ||
        (contentType && contentType !== 'text/html')) {

        return h.continue;
    }

    let options;

    if (request.route.settings.plugins.blankie) {
        options = internals.validateOptions(request.route.settings.plugins.blankie);

        if (options instanceof Error) {
            request.server.log(['error', 'blankie'], `Invalid blankie configuration on route: ${request.route.path}`);
            return h.continue;
        }
    }
    else if (internals.cspCallback) {
        options = internals.cspCallback(request);

        options = internals.validateOptions(options);
        if (options instanceof Error) {
            request.server.log(['error', 'blankie'], 'Invalid blankie configuration from CSP Callback');
            return h.continue;
        }
    }
    else {
        options = Hoek.clone(internals.options);
    }

    const userAgent = request.plugins.scooter || {};
    const version = parseInt(userAgent.major, 10);
    let headerName = 'Content-Security-Policy';
    let policy;

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

    if (!request.response.isBoom) {
        request.response.headers[headerName] = policy;
    }
    else {
        request.response.output.headers[headerName] = policy;
    }

    return h.continue;
};


internals.validateOptions = function (options) {

    let result;

    Schema.validate(options, (err, value) => {

        if (err) {
            result = err;
            return;
        }

        internals.arrayValues.forEach((key) => {

            if (value[key] !== undefined) {
                if (key === 'sandbox' && value[key] === true) {
                    return;
                }

                value[key] = value[key].map((val) => {

                    if (internals.needQuotes.indexOf(val) !== -1) {
                        return `'${val}'`;
                    }

                    return val;
                });
            }
        });

        result = value;
    });

    return result;
};

exports.plugin = {
    register: function (server, options) {

        internals.cspCallback = null;

        if (typeof options === 'function') {
            internals.cspCallback = options;
        }
        else {
            internals.options = internals.validateOptions(options);
            if (internals.options instanceof Error) {
                throw internals.options;
            }
        }

        server.ext('onPreHandler', internals.attachNonces);
        server.ext('onPreResponse', internals.addHeaders);
    },
    dependencies: ['scooter'],
    once: true,
    pkg: require('../package.json')
};
