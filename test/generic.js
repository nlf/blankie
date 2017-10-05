'use strict';

const Blankie = require('../');
const Crypto = require('crypto');
const Hapi = require('hapi');
const Scooter = require('scooter');
const Vision = require('vision');

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.experiment;
const expect = Code.expect;
const it = lab.test;

const defaultRoute = {
    method: 'GET',
    path: '/',
    handler: function (request, reply) {

        reply('defaults');
    }
};

describe('Generic headers', () => {

    it('sends default headers', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

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

    it('allows setting base-uri', (done) => {

        const server = new Hapi.Server();
        const options = {
            baseUri: ['unsafe-inline', 'https://hapijs.com', 'blob:']
        };
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, { register: Blankie, options }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

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

    it('adds a nonce to view contexts', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.register([Scooter, Blankie, Vision], (err) => {

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
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.result.length).to.be.above(1);
                const nonces = res.result.trim().split('\n');
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

    it('allows setting unsafe-inline in combination with nonce on script-src', (done) => {

        const server = new Hapi.Server();
        const options = {
            scriptSrc: ['unsafe-inline']
        };
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, { register: Blankie, options }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
                expect(res.headers['content-security-policy']).to.contain('script-src \'unsafe-inline\' \'nonce-'); // only checks for the nonce- prefix since it's a random value
                expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
                done();
            });
        });
    });

    it('allows settings strict-dynamic with corresponding nonces', (done) => {

        const server = new Hapi.Server();
        const options = {
            scriptSrc: ['strict-dynamic'],
            styleSrc: ['strict-dynamic'],
            generateNonces: true
        };
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, { register: Blankie, options }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('script-src \'strict-dynamic\' \'nonce-');
                expect(res.headers['content-security-policy']).to.contain('style-src \'strict-dynamic\' \'nonce-');
                done();
            });
        });
    });

    it('allows creating nonces for only script-src', (done) => {

        const server = new Hapi.Server();
        const options = {
            generateNonces: 'script'
        };
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, { register: Blankie, options }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('script-src \'self\' \'nonce-');
                expect(res.headers['content-security-policy']).to.not.contain('style-src \'self\' \'nonce-');
                done();
            });
        });
    });

    it('allows creating nonces for only style-src', (done) => {

        const server = new Hapi.Server();
        const options = {
            generateNonces: 'style'
        };
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, { register: Blankie, options }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('style-src \'self\' \'nonce-');
                expect(res.headers['content-security-policy']).to.not.contain('script-src \'self\' \'nonce-');
                done();
            });
        });
    });

    it('sets headers when content-type is set and is text/html', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                reply('test').type('text/html');
            }
        });

        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                done();
            });
        });
    });

    it('does not set headers when content-type is set and is not text/html', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                reply({ some: 'body' }).type('application/json');
            }
        });

        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.not.contain('content-security-policy');
                done();
            });
        });
    });

    it('does not blow up if Crypto.pseudoRandomBytes happens to throw', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            Crypto._randomBytes = Crypto.randomBytes;
            Crypto.randomBytes = function () {

                throw new Error('mocked failure');
            };

            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

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

    it('sends default headers when scooter is not loaded', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register(Blankie, (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

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

    it('sends report only headers when requested', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                defaultSrc: 'self',
                reportOnly: true,
                reportUri: '/csp_report'
            }
        }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy-report-only');
                expect(res.headers['content-security-policy-report-only']).to.contain('default-src \'self\'');
                expect(res.headers['content-security-policy-report-only']).to.contain('report-uri /csp_report');
                done();
            });
        });
    });

    it('does not crash when responding with an error', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                reply(new Error('broken!'));
            }
        });
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

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

    it('allows setting the sandbox directive with no values', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                sandbox: true
            }
        }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('sandbox');
                done();
            });
        });
    });

    it('allows setting array directives to a single string', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                defaultSrc: '*'
            }
        }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('default-src *');
                done();
            });
        });
    });

    it('allows setting array directives to an array of strings', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                defaultSrc: ['*', 'self']
            }
        }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('default-src * \'self\'');
                done();
            });
        });
    });

    it('exposes nonces on request.plugins.blankie.nonces', (done) => {

        const server = new Hapi.Server();
        const options = {
            generateNonces: true
        };
        server.connection();
        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                return reply(request.plugins.blankie.nonces);
            }
        });
        server.register([Scooter, { register: Blankie, options }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.result).to.contain(['style', 'script']);
                expect(res.result.style).to.be.a.string();
                expect(res.result.script).to.be.a.string();
                done();
            });
        });
    });

    it('can be disabled on a single route', (done) => {

        const server = new Hapi.Server();
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
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

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
                }, (res2) => {

                    expect(res2.statusCode).to.equal(200);
                    expect(res2.headers).to.not.contain('content-security-policy');
                    done();
                });
            });
        });
    });

    it('can be overridden on a single route', (done) => {

        const server = new Hapi.Server();
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
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

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
                }, (res2) => {

                    expect(res2.statusCode).to.equal(200);
                    expect(res2.headers).to.contain('content-security-policy');
                    expect(res2.headers['content-security-policy']).to.contain('default-src \'self\'');
                    done();
                });
            });
        });
    });

    it('self disables when a route override is invalid', (done) => {

        const server = new Hapi.Server();
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
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/'
            }, (res) => {

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
                }, (res2) => {

                    expect(res2.statusCode).to.equal(200);
                    expect(res2.headers).to.not.contain('content-security-policy');
                    done();
                });
            });
        });
    });
});
