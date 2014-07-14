var Joi = require('joi');


module.exports = Joi.alternatives().try(
    Joi.boolean(),
    Joi.object({
        reportOnly: Joi.boolean().default(true)
    })
);
