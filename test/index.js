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
});
