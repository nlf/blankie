'use strict';

const Agents = require('browser-agents');
const Blankie = require('../');
const Hapi = require('hapi');
const Scooter = require('scooter');

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.experiment;
const expect = Code.expect;
const it = lab.test;

const defaultRoute = {
    method: 'GET',
    path: '/',
    handler: function (request, reply) {

        reply('defaults');
    }
};

describe('Internet Explorer', () => {

    it('sends nothing by default', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.IE.random()
                }
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.equal('');
                done();
            });
        });
    });

    it('sends sandbox headers if set', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                sandbox: 'allow-same-origin'
            }
        }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.IE.random()
                }
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.equal('sandbox allow-same-origin');
                done();
            });
        });
    });
});
