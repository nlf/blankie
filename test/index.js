'use strict';

const Blankie = require('../');
const Hapi = require('hapi');
const Scooter = require('scooter');

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.experiment;
const expect = Code.expect;
const it = lab.test;

describe('Blankie', () => {

    it('loads as a plugin', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('errors with invalid options', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.register([Scooter, {
            register: Blankie,
            options: {
                reportOnly: 'invalid value'
            }
        }], (err) => {

            expect(err).to.exist();
            done();
        });
    });
});
