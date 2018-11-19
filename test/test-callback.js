'use strict';

const Blankie = require('../');
const Hapi = require('hapi');
const Scooter = require('scooter');

const { expect } = require('code');
const { describe, it } = exports.lab = require('lab').script();

describe('Blankie', () => {
    it('allows a callback as the only option', async () => {

        const cspCallback = function (req) {
            const options = {};
            options.baseUri = 'self';
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
