'use strict';

const Agents = require('browser-agents');
const Blankie = require('../');
const Hapi = require('@hapi/hapi');
const Scooter = require('@hapi/scooter');

const { expect } = require('@hapi/code');

const { describe, it } = exports.lab = require('@hapi/lab').script();

const defaultRoute = {
    method: 'GET',
    path: '/',
    handler: () => {

        return 'defaults';
    }
};

describe('Chrome', () => {

    it('sends defaults for chrome > 25', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Chrome['26.0']
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

    it('sends defaults for chrome < 14', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Chrome['13.0']
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

    it('sends x-webkit-csp for > 14 and < 25', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Chrome['15.0']
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
});
