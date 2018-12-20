'use strict';

const Agents = require('browser-agents');
const Blankie = require('../');
const Hapi = require('hapi');
const Scooter = require('scooter');

const { expect } = require('code');

const { describe, it } = exports.lab = require('lab').script();

const defaultRoute = {
    method: 'GET',
    path: '/',
    handler: () => {

        return 'defaults';
    }
};

describe('Safari', () => {

    it('sends defaults for >= 7.0', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Safari['7.0']
            }
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
        expect(res.headers['content-security-policy']).to.contain('script-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
    });

    it('sends x-webkit-csp for 6.0', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Safari['6.0']
            }
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('x-webkit-csp');
        expect(res.headers['x-webkit-csp']).to.contain('default-src \'none\'');
        expect(res.headers['x-webkit-csp']).to.contain('script-src \'self\'');
        expect(res.headers['x-webkit-csp']).to.contain('style-src \'self\'');
        expect(res.headers['x-webkit-csp']).to.contain('img-src \'self\'');
        expect(res.headers['x-webkit-csp']).to.contain('connect-src \'self\'');
    });

    it('sends x-webkit-csp for 5.0 if oldSafari = true', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, {
            plugin: Blankie,
            options: {
                oldSafari: true
            }
        }]);

        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Safari['5.0']
            }
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('x-webkit-csp');
        expect(res.headers['x-webkit-csp']).to.contain('default-src \'none\'');
        expect(res.headers['x-webkit-csp']).to.contain('script-src \'self\'');
        expect(res.headers['x-webkit-csp']).to.contain('style-src \'self\'');
        expect(res.headers['x-webkit-csp']).to.contain('img-src \'self\'');
        expect(res.headers['x-webkit-csp']).to.contain('connect-src \'self\'');
    });

    it('sends default header for 5.0 if oldSafari = false', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Safari['5.0']
            }
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
        expect(res.headers['content-security-policy']).to.contain('script-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
        expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
    });
});
