var Joi = require('joi');

module.exports = Joi.object({
    baseUri: Joi.array().items(Joi.string()).single().default(['self']),
    childSrc: Joi.array().items(Joi.string()).single(),
    connectSrc: Joi.array().items(Joi.string()).single().default(['self']),
    defaultSrc: Joi.array().items(Joi.string()).single().default(['none']),
    fontSrc: Joi.array().items(Joi.string()).single(),
    formAction: Joi.array().items(Joi.string()).single(),
    frameAncestors: Joi.array().items(Joi.string()).single(),
    frameSrc: Joi.array().items(Joi.string()).single(),
    imgSrc: Joi.array().items(Joi.string()).single().default(['self']),
    manifestSrc: Joi.array().items(Joi.string()).single(),
    mediaSrc: Joi.array().items(Joi.string()).single(),
    objectSrc: Joi.array().items(Joi.string()).single(),
    oldSafari: Joi.boolean(),
    pluginTypes: Joi.array().items(Joi.string()).single(),
    reflectedXss: Joi.string().valid('allow', 'block', 'filter'),
    reportOnly: Joi.boolean(),
    reportUri: Joi.string(),
    requireSriFor: Joi.array().items(Joi.string()).single(),
    sandbox: [
        Joi.array().items(Joi.string().valid('allow-forms', 'allow-same-origin', 'allow-scripts', 'allow-top-navigation')).single(),
        Joi.boolean()
    ],
    scriptSrc: Joi.array().items(Joi.string()).single().default(['self'])
        .when('generateNonces', { is: [false, 'style'], then: Joi.array().items(Joi.string().valid('strict-dynamic').forbidden()) }),
    styleSrc: Joi.array().items(Joi.string()).single().default(['self'])
        .when('generateNonces', { is: [false, 'script'], then: Joi.array().items(Joi.string().valid('strict-dynamic').forbidden()) }),
    generateNonces: Joi.alternatives().try([Joi.boolean(), Joi.string().valid('script', 'style')]).default(true)
}).with('reportOnly', 'reportUri');
