'use strict';

const Blankie = require('../');
const Hapi = require('hapi');
const Scooter = require('scooter');

const { expect } = require('code');
const { describe, it } = exports.lab = require('lab').script();

describe('Blankie', () => {

    it('loads as a plugin', async () => {

        const server = Hapi.server();
        await server.register([Scooter, Blankie]);
    });

    it('errors with invalid options', async () => {

        const server = Hapi.server();
        await expect(server.register([Scooter, {
            plugin: Blankie,
            options: {
                reportOnly: 'invalid value'
            }
        }])).to.reject(Error, 'child "reportOnly" fails because ["reportOnly" must be a boolean]');
    });

    it.only('allows a callback as the only option', async () => {

        const cspCallback = function () {

            const options = {};
            options['base-uri'] = 'self';
            return options;
        };
        const server = Hapi.server();
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
});
