/* jshint -W030 */
var Agents = require('browser-agents');
var Blankie = require('../');
var Hapi = require('hapi');
var Scooter = require('scooter');

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;

var defaultRoute = {
    method: 'GET',
    path: '/',
    handler: function (request, reply) {

        reply('defaults');
    }
};

describe('Safari', function () {

    it('sends defaults for >= 7.0', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Safari['7.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                done();
            });
        });
    });

    it('sends x-webkit-csp for 6.0', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Safari['6.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-webkit-csp');
                expect(res.headers['x-webkit-csp']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                done();
            });
        });
    });

    it('sends x-webkit-csp for 5.0 if oldSafari = true', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                oldSafari: true
            }
        }], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Safari['5.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-webkit-csp');
                expect(res.headers['x-webkit-csp']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                done();
            });
        });
    });

    it('sends default header for 5.0 if oldSafari = false', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Safari['5.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                done();
            });
        });
    });
});
