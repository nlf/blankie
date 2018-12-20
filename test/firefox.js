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

describe('Firefox', () => {

    it('sends defaults for firefox > 23', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Firefox['24.0']
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

    it('sends firefox specific headers for >= 5 < 24', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Firefox['23.0']
            }
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('x-content-security-policy');
        expect(res.headers['x-content-security-policy']).to.contain('default-src \'none\'');
        expect(res.headers['x-content-security-policy']).to.contain('script-src \'self\'');
        expect(res.headers['x-content-security-policy']).to.contain('style-src \'self\'');
        expect(res.headers['x-content-security-policy']).to.contain('img-src \'self\'');
        expect(res.headers['x-content-security-policy']).to.contain('xhr-src \'self\'');
    });

    it('sends allow instead of default-src for firefox 4', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Firefox['4.0']
            }
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('x-content-security-policy');
        expect(res.headers['x-content-security-policy']).to.contain('allow \'none\'');
        expect(res.headers['x-content-security-policy']).to.contain('script-src \'self\'');
        expect(res.headers['x-content-security-policy']).to.contain('style-src \'self\'');
        expect(res.headers['x-content-security-policy']).to.contain('img-src \'self\'');
        expect(res.headers['x-content-security-policy']).to.contain('xhr-src \'self\'');
    });

    it('sends defaults for firefox < 4', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, Blankie]);
        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Firefox['3.0']
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

    it('replaces unsafe-inline with inline-script for older firefox', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, {
            plugin: Blankie,
            options: {
                scriptSrc: 'unsafe-inline'
            }
        }]);

        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Firefox['22.0']
            }
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('x-content-security-policy');
        expect(res.headers['x-content-security-policy']).to.contain('script-src \'inline-script\'');
    });

    it('replaces unsafe-eval with eval-script for older firefox', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, {
            plugin: Blankie,
            options: {
                scriptSrc: 'unsafe-eval'
            }
        }]);

        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Firefox['22.0']
            }
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('x-content-security-policy');
        expect(res.headers['x-content-security-policy']).to.contain('script-src \'eval-script\'');
    });

    it('removes unsafe-eval from non script-src directives', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, {
            plugin: Blankie,
            options: {
                objectSrc: ['unsafe-inline', 'unsafe-eval', 'self']
            }
        }]);

        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Firefox['22.0']
            }
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('x-content-security-policy');
        expect(res.headers['x-content-security-policy']).to.contain('object-src \'self\'');
    });

    it('doesnt set empty strings if invalid values are all removed', async () => {

        const server = Hapi.server();
        server.route(defaultRoute);
        await server.register([Scooter, {
            plugin: Blankie,
            options: {
                objectSrc: ['unsafe-inline', 'unsafe-eval']
            }
        }]);

        const res = await server.inject({
            method: 'GET',
            url: '/',
            headers: {
                'User-Agent': Agents.Firefox['22.0']
            }
        });

        expect(res.statusCode).to.equal(200);
        expect(res.headers).to.contain('x-content-security-policy');
        expect(res.headers['x-content-security-policy']).to.not.contain('object-src');
    });
});
