var Joi = require('joi');

module.exports = Joi.object({
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
    requireSri: Joi.array().items(Joi.string()).single(),
    sandbox: [
        Joi.array().items(Joi.string().valid('allow-forms', 'allow-same-origin', 'allow-scripts', 'allow-top-navigation')).single(),
        Joi.boolean()
    ],
    scriptSrc: Joi.array().items(Joi.string()).single().default(['self']),
    styleSrc: Joi.array().items(Joi.string()).single().default(['self']),
    generateNonces: Joi.boolean().default(true)
}).with('reportOnly', 'reportUri');
