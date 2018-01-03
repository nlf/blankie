'use strict';

const Blankie = require('../');
const Crypto = require('crypto');
const Hapi = require('hapi');
const Scooter = require('scooter');
const Vision = require('vision');

const { expect } = require('code');
const { describe, it } = exports.lab = require('lab').script();

const defaultRoute = {
    method: 'GET',
    path: '/',
    handler: () => {

        return 'defaults';
    }
};

describe('Generic headers', () => {

    it('sends default headers', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('base-uri \'self');
        expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
        expect(res.headers['content-security-policy']).to.contain('script-src \'self\' \'nonce-'); // only checks for the nonce- prefix since it's a random value
        expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
    });

    it('allows setting base-uri', async () => {

        const server = Hapi.server();
        const options = {
            baseUri: ['unsafe-inline', 'https://hapijs.com', 'blob:']
        };
        server.route(defaultRoute);
        await server.register([Scooter, { plugin: Blankie, options }]);
        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('base-uri \'unsafe-inline\' https://hapijs.com blob:');
        expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
        expect(res.headers['content-security-policy']).to.contain('script-src \'self\' \'nonce-'); // only checks for the nonce- prefix since it's a random value
        expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
    });

    it('adds a nonce to view contexts', async () => {

        const server = Hapi.server();
        await server.register([Scooter, Blankie, Vision]);

        server.views({
            engines: {
                html: require('handlebars')
            },
            path: __dirname + '/templates'
        });

        server.route({
            method: 'GET',
            path: '/',
            handler: (request, h) => {

                return h.view('nonce');
            }
        });

        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.result.length).to.be.above(1);
        const nonces = res.result.trim().split('\n');
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
        expect(res.headers['content-security-policy']).to.contain('script-src \'self\' \'nonce-' + nonces[0] + '\'');
        expect(res.headers['content-security-policy']).to.contain('style-src \'self\' \'nonce-' + nonces[1] + '\'');
        expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
    });

    it('allows setting unsafe-inline in combination with nonce on script-src', async () => {

        const server = Hapi.server();
        const options = {
            scriptSrc: ['unsafe-inline']
        };
        server.route(defaultRoute);
        await server.register([Scooter, { plugin: Blankie, options }]);
        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
        expect(res.headers['content-security-policy']).to.contain('script-src \'unsafe-inline\' \'nonce-'); // only checks for the nonce- prefix since it's a random value
        expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
    });

    it('allows settings strict-dynamic with corresponding nonces', async () => {

        const server = Hapi.server();
        const options = {
            scriptSrc: ['strict-dynamic'],
            styleSrc: ['strict-dynamic'],
            generateNonces: true
        };
        server.route(defaultRoute);
        await server.register([Scooter, { plugin: Blankie, options }]);
        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('script-src \'strict-dynamic\' \'nonce-');
        expect(res.headers['content-security-policy']).to.contain('style-src \'strict-dynamic\' \'nonce-');
    });

    it('allows creating nonces for only script-src', async () => {

        const server = Hapi.server();
        const options = {
            generateNonces: 'script'
        };
        server.route(defaultRoute);
        await server.register([Scooter, { plugin: Blankie, options }]);
        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('script-src \'self\' \'nonce-');
        expect(res.headers['content-security-policy']).to.not.contain('style-src \'self\' \'nonce-');
    });

    it('allows creating nonces for only style-src', async () => {

        const server = Hapi.server();
        const options = {
            generateNonces: 'style'
        };
        server.route(defaultRoute);
        await server.register([Scooter, { plugin: Blankie, options }]);
        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('style-src \'self\' \'nonce-');
        expect(res.headers['content-security-policy']).to.not.contain('script-src \'self\' \'nonce-');
    });

    it('sets headers when content-type is set and is text/html', async () => {

        const server = Hapi.server();
        server.route({
            method: 'GET',
            path: '/',
            handler: (request, h) => {

                return h.response('test').type('text/html');
            }
        });

        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
    });

    it('does not set headers when content-type is set and is not text/html', async () => {

        const server = Hapi.server();
        server.route({
            method: 'GET',
            path: '/',
            handler: (request, h) => {

                return h.response({ some: 'body' }).type('application/json');
            }
        });

        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.not.contain('content-security-policy');
    });

    it('does not blow up if Crypto.pseudoRandomBytes happens to throw', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, Blankie]);

        Crypto._randomBytes = Crypto.randomBytes;
        Crypto.randomBytes = function () {

            throw new Error('mocked failure');
        };

        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
        expect(res.headers['content-security-policy']).to.contain('script-src \'self\' \'nonce-'); // only checks for the nonce- prefix since it's a random value
        expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
        Crypto.randomBytes = Crypto._randomBytes;
        delete Crypto._randomBytes;
    });

    it('sends default headers when scooter is not loaded', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register(Blankie);
        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
        expect(res.headers['content-security-policy']).to.contain('script-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
    });

    it('sends report only headers when requested', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, {
            plugin: Blankie,
            options: {
                defaultSrc: 'self',
                reportOnly: true,
                reportUri: '/csp_report'
            }
        }]);

        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy-report-only');
        expect(res.headers['content-security-policy-report-only']).to.contain('default-src \'self\'');
        expect(res.headers['content-security-policy-report-only']).to.contain('report-uri /csp_report');
    });

    it('does not crash when responding with an error', async () => {

        const server = Hapi.server();
        server.route({
            method: 'GET',
            path: '/',
            handler: (request, h) => {

                throw new Error('broken!');
            }
        });
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(500);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
        expect(res.headers['content-security-policy']).to.contain('script-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
    });

    it('allows setting the sandbox directive with no values', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, {
            plugin: Blankie,
            options: {
                sandbox: true
            }
        }]);

        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('sandbox');
    });

    it('allows setting array directives to a single string', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, {
            plugin: Blankie,
            options: {
                defaultSrc: '*'
            }
        }]);

        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('default-src *');
    });

    it('allows setting array directives to an array of strings', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, {
            plugin: Blankie,
            options: {
                defaultSrc: ['*', 'self']
            }
        }]);

        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('default-src * \'self\'');
    });

    it('exposes nonces on request.plugins.blankie.nonces', async () => {

        const server = Hapi.server();
        const options = {
            generateNonces: true
        };
        server.route({
            method: 'GET',
            path: '/',
            handler: (request) => {

                return request.plugins.blankie.nonces;
            }
        });
        await server.register([Scooter, { plugin: Blankie, options }]);
        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.result).to.contain(['style', 'script']);
        expect(res.result.style).to.be.a.string();
        expect(res.result.script).to.be.a.string();
    });

    it('skips headers on OPTIONS requests', async () => {

        const server = Hapi.server();
        const options = {
            generateNonces: true
        };
        server.route({
            method: 'OPTIONS',
            path: '/',
            handler: () => {

                return '';
            }
        });
        await server.register([Scooter, { plugin: Blankie, options }]);
        const res = await server.inject({
            method: 'OPTIONS',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.not.include('content-security-policy');
    });

    it('does not throw on 404 when generating nonces', async () => {

        const server = Hapi.server();
        const options = {
            generateNonces: true
        };
        server.route({
            method: 'GET',
            path: '/',
            handler: () => {

                return '';
            }
        });
        await server.register([Scooter, { plugin: Blankie, options }]);
        const res = await server.inject({
            method: 'GET',
            url: '/404'
        });

        expect(res.statusCode).to.equal(404);
        expect(res.headers).to.include('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('script-src \'self\' \'nonce-');
        expect(res.headers['content-security-policy']).to.contain('style-src \'self\' \'nonce-');
    });

    it('can be disabled on a single route', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        server.route({
            method: 'GET',
            path: '/disabled',
            config: {
                handler: () => {

                    return 'disabled';
                },
                plugins: {
                    blankie: false
                }
            }
        });
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
        expect(res.headers['content-security-policy']).to.contain('script-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');

        const res2 = await server.inject({
            method: 'GET',
            url: '/disabled'
        });

        expect(res2.statusCode).to.equal(200);
        expect(res2.headers).to.not.contain('content-security-policy');
    });

    it('can be overridden on a single route', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        server.route({
            method: 'GET',
            path: '/overridden',
            config: {
                handler: () => {

                    return 'overridden';
                },
                plugins: {
                    blankie: {
                        defaultSrc: 'self'
                    }
                }
            }
        });
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
        expect(res.headers['content-security-policy']).to.contain('script-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');

        const res2 = await server.inject({
            method: 'GET',
            url: '/overridden'
        });

        expect(res2.statusCode).to.equal(200);
        expect(res2.headers).to.contain('content-security-policy');
        expect(res2.headers['content-security-policy']).to.contain('default-src \'self\'');
    });

    it('self disables when a route override is invalid', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        server.route({
            method: 'GET',
            path: '/invalid',
            config: {
                handler: () => {

                    return 'invalid';
                },
                plugins: {
                    blankie: {
                        sandbox: 'self'
                    }
                }
            }
        });
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
        expect(res.headers['content-security-policy']).to.contain('script-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');

        const res2 = await server.inject({
            method: 'GET',
            url: '/invalid'
        });

        expect(res2.statusCode).to.equal(200);
        expect(res2.headers).to.not.contain('content-security-policy');
    });
});
