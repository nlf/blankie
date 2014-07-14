var Schema = require('./schema');

exports.register = function (plugin, options, next) {

    Schema.validate(options, function (err, value) {
        
        if (err) {
            return next(err);
        }

        options = value;
    });

    return next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};
