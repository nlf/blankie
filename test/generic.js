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
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                done();
            });
        });
    });

    it('sends default headers when scooter is not loaded', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register(Blankie, function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                done();
            });
        });
    });

    it('sends report only headers when requested', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
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
                expect(res.headers).to.contain('content-security-policy-report-only');
                expect(res.headers['content-security-policy-report-only']).to.equal('default-src \'self\';report-uri /csp_report');
                done();
            });
        });
    });

    it('does not crash when responding with an error', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                reply(new Error('broken!'));
            }
        });
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(500);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                done();
            });
        });
    });

    it('allows setting the sandbox directive with no values', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
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
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('sandbox');
                done();
            });
        });
    });

    it('allows setting array directives to a single string', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
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
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src *');
                done();
            });
        });
    });

    it('allows setting array directives to an array of strings', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
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
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src * \'self\'');
                done();
            });
        });
    });

    it('can be disabled on a single route', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.route({
            method: 'GET',
            path: '/disabled',
            config: {
                handler: function (request, reply) {

                    reply('disabled');
                },
                plugins: {
                    blankie: false
                }
            }
        });
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                server.inject({
                    method: 'GET',
                    url: '/disabled'
                }, function (res) {

                    expect(res.statusCode).to.equal(200);
                    expect(res.headers).to.not.contain('content-security-policy');
                    done();
                });
            });
        });
    });

    it('can be overridden on a single route', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.route({
            method: 'GET',
            path: '/overridden',
            config: {
                handler: function (request, reply) {

                    reply('disabled');
                },
                plugins: {
                    blankie: {
                        defaultSrc: 'self'
                    }
                }
            }
        });
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                server.inject({
                    method: 'GET',
                    url: '/overridden'
                }, function (res) {

                    expect(res.statusCode).to.equal(200);
                    expect(res.headers).to.contain('content-security-policy');
                    expect(res.headers['content-security-policy']).to.equal('default-src \'self\'');
                    done();
                });
            });
        });
    });

    it('self disables when a route override is invalid', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.route({
            method: 'GET',
            path: '/invalid',
            config: {
                handler: function (request, reply) {

                    reply('disabled');
                },
                plugins: {
                    blankie: {
                        sandbox: 'self'
                    }
                }
            }
        });
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                server.inject({
                    method: 'GET',
                    url: '/invalid'
                }, function (res) {

                    expect(res.statusCode).to.equal(200);
                    expect(res.headers).to.not.contain('content-security-policy');
                    done();
                });
            });
        });
    });
});
