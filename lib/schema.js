var Joi = require('joi');

var strOrArray = Joi.alternatives().try(Joi.string(), Joi.array().includes(Joi.string()));
var sandboxString = Joi.string().valid('allow-forms', 'allow-same-origin', 'allow-scripts', 'allow-top-navigation');

module.exports = Joi.object().keys({
    defaultSrc: strOrArray.default('\'none\''),
    scriptSrc: strOrArray.default('\'self\''),
    styleSrc: strOrArray.default('\'self\''),
    imgSrc: strOrArray.default('\'self\''),
    connectSrc: strOrArray.default('\'self\''),
    fontSrc: strOrArray,
    objectSrc: strOrArray,
    mediaSrc: strOrArray,
    frameSrc: strOrArray,
    sandbox: [
        sandboxString,
        Joi.array().includes(sandboxString),
        Joi.boolean()
    ],
    reportUri: Joi.string(),
    reportOnly: Joi.boolean().default(false),
    oldSafari: Joi.boolean().default(false)
});
