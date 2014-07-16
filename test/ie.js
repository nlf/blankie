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

describe('Internet Explorer', function () {

    it('sends nothing by default', function (done) {

        var server = new Hapi.Server();
        server.route(defaultRoute);
        server.pack.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.IE.random()
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain.key('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.equal('');
                done();
            });
        });
    });

    it('sends sandbox headers if set', function (done) {

        var server = new Hapi.Server();
        server.route(defaultRoute);
        server.pack.register([Scooter, {
            plugin: Blankie,
            options: {
                sandbox: 'allow-same-origin'
            }
        }], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.IE.random()
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain.key('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.equal('sandbox allow-same-origin');
                done();
            });
        });
    });
});
