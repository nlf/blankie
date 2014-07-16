/* jshint -W030 */
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

describe('Generic headers', function () {

    it('sends default headers', function (done) {

        var server = new Hapi.Server();
        server.route(defaultRoute);
        server.pack.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain.key('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                done();
            });
        });
    });

    it('sends report only headers when requested', function (done) {

        var server = new Hapi.Server();
        server.route(defaultRoute);
        server.pack.register([Scooter, {
            plugin: Blankie,
            options: {
                defaultSrc: 'self',
                reportOnly: true,
                reportUri: '/csp_report'
            }
        }], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain.key('content-security-policy-report-only');
                expect(res.headers['content-security-policy-report-only']).to.equal('default-src \'self\';report-uri /csp_report');
                done();
            });
        });
    });

    it('does not crash when responding with an error', function (done) {

        var server = new Hapi.Server();
        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                reply(new Error('broken!'));
            }
        });
        server.pack.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(500);
                expect(res.headers).to.contain.key('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                done();
            });
        });
    });

    it('allows setting the sandbox directive with no values', function (done) {

        var server = new Hapi.Server();
        server.route(defaultRoute);
        server.pack.register([Scooter, {
            plugin: Blankie,
            options: {
                sandbox: true
            }
        }], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain.key('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('sandbox');
                done();
            });
        });
    });

    it('allows setting array directives to a single string', function (done) {

        var server = new Hapi.Server();
        server.route(defaultRoute);
        server.pack.register([Scooter, {
            plugin: Blankie,
            options: {
                defaultSrc: '*'
            }
        }], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain.key('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src *');
                done();
            });
        });
    });

    it('allows setting array directives to an array of strings', function (done) {

        var server = new Hapi.Server();
        server.route(defaultRoute);
        server.pack.register([Scooter, {
            plugin: Blankie,
            options: {
                defaultSrc: ['*', 'self']
            }
        }], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain.key('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src * \'self\'');
                done();
            });
        });
    });
});
