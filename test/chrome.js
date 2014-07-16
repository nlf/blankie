/* jshint -W030 */
var Agents = require('browser-agents');
var Blankie = require('../');
var Hapi = require('hapi');
var Scooter = require('scooter');

var Lab = require('lab');

var describe = Lab.experiment;
var expect = Lab.expect;
var it = Lab.test;

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
        server.route(defaultRoute);
        server.pack.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Chrome['26.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain.key('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                done();
            });
        });
    });

    it('sends defaults for chrome < 14', function (done) {

        var server = new Hapi.Server();
        server.route(defaultRoute);
        server.pack.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Chrome['13.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain.key('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                done();
            });
        });
    });

    it('sends x-webkit-csp for > 14 and < 25', function (done) {

        var server = new Hapi.Server();
        server.route(defaultRoute);
        server.pack.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Chrome['15.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain.key('x-webkit-csp');
                expect(res.headers['x-webkit-csp']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                done();
            });
        });
    });
});
