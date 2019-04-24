'use strict';

const Blankie = require('../');
const Hapi = require('@hapi/hapi');
const Scooter = require('@hapi/scooter');

const { expect } = require('@hapi/code');

const { describe, it } = exports.lab = require('@hapi/lab').script();

describe('Callbacks', () => {

    it('allows a callback as the only option', async () => {

        const cspCallback = function (req) {

            const options = {};
            options.baseUri = 'self';
            return options;
        };

        const server = Hapi.server();
        server.route({
            method: 'GET',
            path: '/',
            handler: () => {

                return 'callback';
            }
        });

        await server.register([Scooter, {
            plugin: Blankie,
            options: cspCallback
        }]);

        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.headers).to.contain('content-security-policy');
        expect(res.headers['content-security-policy']).to.contain('base-uri \'self');
    });

    it('errors appropriately and skips setting header if callback returns invalid options', async () => {

        const cspCallback = function (req) {

            const options = {};
            options.bananas = 'self';
            return options;
        };

        const server = Hapi.server();
        server.route({
            method: 'GET',
            path: '/',
            handler: () => {

                return 'callback';
            }
        });

        await server.register([Scooter, {
            plugin: Blankie,
            options: cspCallback
        }]);

        const res = await server.inject({
            method: 'GET',
            url: '/'
        });

        expect(res.headers).to.not.contain('content-security-policy');
    });
});
