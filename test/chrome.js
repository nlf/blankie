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

describe('Chrome', () => {

    it('sends defaults for chrome > 25', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Chrome['26.0']
                }
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
                expect(res.headers['content-security-policy']).to.contain('script-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
                done();
            });
        });
    });

    it('sends defaults for chrome < 14', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Chrome['13.0']
                }
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.contain('default-src \'none\'');
                expect(res.headers['content-security-policy']).to.contain('script-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('style-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('img-src \'self\'');
                expect(res.headers['content-security-policy']).to.contain('connect-src \'self\'');
                done();
            });
        });
    });

    it('sends x-webkit-csp for > 14 and < 25', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Chrome['15.0']
                }
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-webkit-csp');
                expect(res.headers['x-webkit-csp']).to.contain('default-src \'none\'');
                expect(res.headers['x-webkit-csp']).to.contain('script-src \'self\'');
                expect(res.headers['x-webkit-csp']).to.contain('style-src \'self\'');
                expect(res.headers['x-webkit-csp']).to.contain('img-src \'self\'');
                expect(res.headers['x-webkit-csp']).to.contain('connect-src \'self\'');
                done();
            });
        });
    });
});
