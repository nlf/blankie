/* jshint -W030 */
var Blankie = require('../');
var Hapi = require('hapi');
var Scooter = require('scooter');

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;

describe('Blankie', function () {

    it('loads as a plugin', function (done) {

        var server = new Hapi.Server();
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            done();
        });
    });

    it('errors with invalid options', function (done) {

        var server = new Hapi.Server();
        server.register([Scooter, {
            register: Blankie,
            options: {
                reportOnly: 'invalid value'
            }
        }], function (err) {
        
            expect(err).to.exist;
            done();
        });
    });
});
