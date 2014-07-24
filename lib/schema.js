var Joi = require('joi');

var strOrArray = Joi.alternatives().try(Joi.string(), Joi.array().includes(Joi.string()));
var sandboxString = Joi.string().valid('allow-forms', 'allow-same-origin', 'allow-scripts', 'allow-top-navigation');

module.exports = Joi.object().keys({
    defaultSrc: strOrArray,
    scriptSrc: strOrArray,
    styleSrc: strOrArray,
    imgSrc: strOrArray,
    connectSrc: strOrArray,
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
    reportOnly: Joi.boolean(),
    oldSafari: Joi.boolean()
}).with('reportOnly', 'reportUri');
