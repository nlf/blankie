/* jshint -W030 */
var Blankie = require('../');
var Crypto = require('crypto');
var Hapi = require('hapi');
var Scooter = require('scooter');
var Vision = require('vision');

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

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('base-uri \'self');
                expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
                expect(res.headers['content-security-policy']).to.contain('script-src \'self\' \'nonce-'); // only checks for the nonce- prefix since it's a random value
                expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
                done();
            });
        });
    });

    it('allows setting base-uri', function (done) {

        var server = new Hapi.Server();
        var options = {
            baseUri: ['unsafe-inline', 'https://hapijs.com', 'blob:']
        }
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, { register: Blankie, options: options }], function (err) {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('base-uri \'unsafe-inline\' https://hapijs.com blob:');
                expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
                expect(res.headers['content-security-policy']).to.contain('script-src \'self\' \'nonce-'); // only checks for the nonce- prefix since it's a random value
                expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
                done();
            });
        });
    });

    it('adds a nonce to view contexts', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.register([Scooter, Blankie, Vision], function (err) {

            expect(err).to.not.exist();
            server.views({
                engines: {
                    html: require('handlebars')
                },
                path: __dirname + '/templates'
            });

            server.route({
                method: 'GET',
                path: '/',
                handler: function (request, reply) {

                    reply.view('nonce');
                }
            });

            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.result.length).to.be.above(1);
                var nonces = res.result.trim().split('\n');
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
                expect(res.headers['content-security-policy']).to.contain('script-src \'self\' \'nonce-' + nonces[0] + '\'');
                expect(res.headers['content-security-policy']).to.contain('style-src \'self\' \'nonce-' + nonces[1] + '\'');
                expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
                done();
            });
        });
    });

    it('adds a nonce to plugin properties in request', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist();

            server.route({
                method: 'GET',
                path: '/',
                handler: function (request, reply) {
                    reply.continue();
                }
            });

            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {
                expect(res.request.plugins.blankie.scriptSrcNonce.length).to.equal(32);
                expect(res.request.plugins.blankie.styleSrcNonce.length).to.equal(32);
                done();
            });
        });
    });

    it('does not blow up if Crypto.pseudoRandomBytes happens to throw', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist();
            Crypto._randomBytes = Crypto.randomBytes;
            Crypto.randomBytes = function () {

                throw new Error('mocked failure');
            };

            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
                expect(res.headers['content-security-policy']).to.contain('script-src \'self\' \'nonce-'); // only checks for the nonce- prefix since it's a random value
                expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
                Crypto.randomBytes = Crypto._randomBytes;
                delete Crypto._randomBytes;
                done();
            });
        });
    });

    it('sends default headers when scooter is not loaded', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register(Blankie, function (err) {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
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

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy-report-only');
                expect(res.headers['content-security-policy-report-only']).to.contain('default-src \'self\'');
                expect(res.headers['content-security-policy-report-only']).to.contain('report-uri /csp_report');
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

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(500);
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

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('sandbox');
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

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('default-src *');
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

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('default-src * \'self\'');
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

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
                expect(res.headers['content-security-policy']).to.contain('script-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
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

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
                expect(res.headers['content-security-policy']).to.contain('script-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
                server.inject({
                    method: 'GET',
                    url: '/overridden'
                }, function (res) {

                    expect(res.statusCode).to.equal(200);
                    expect(res.headers).to.contain('content-security-policy');
                    expect(res.headers['content-security-policy']).to.contain('default-src \'self\'');
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

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
                expect(res.headers['content-security-policy']).to.contain('script-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
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
