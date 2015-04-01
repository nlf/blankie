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

describe('Chrome', function () {

    it('sends defaults for chrome > 25', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Chrome['26.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
                expect(res.headers['content-security-policy']).to.contain('script-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
                done();
            });
        });
    });

    it('sends defaults for chrome < 14', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Chrome['13.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
                expect(res.headers['content-security-policy']).to.contain('script-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
                done();
            });
        });
    });

    it('sends x-webkit-csp for > 14 and < 25', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Chrome['15.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-webkit-csp');
                expect(res.headers['x-webkit-csp']).to.contain('default-src \'none\'');
                expect(res.headers['x-webkit-csp']).to.contain('script-src \'self\'');
                expect(res.headers['x-webkit-csp']).to.contain('style-src \'self\'');
                expect(res.headers['x-webkit-csp']).to.contain('img-src \'self\'');
                expect(res.headers['x-webkit-csp']).to.contain('connect-src \'self\'');
                done();
            });
        });
    });
});
