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

describe('Internet Explorer', () => {

    it('sends nothing by default', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.IE.random()
            }
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('x-content-security-policy');
        expect(res.headers['x-content-security-policy']).to.equal('');
    });

    it('sends sandbox headers if set', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, {
            plugin: Blankie,
            options: {
                sandbox: 'allow-same-origin'
            }
        }]);

        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.IE.random()
            }
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('x-content-security-policy');
        expect(res.headers['x-content-security-policy']).to.equal('sandbox allow-same-origin');
    });
});
