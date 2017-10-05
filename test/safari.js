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

describe('Safari', () => {

    it('sends defaults for >= 7.0', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Safari['7.0']
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

    it('sends x-webkit-csp for 6.0', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Safari['6.0']
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

    it('sends x-webkit-csp for 5.0 if oldSafari = true', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                oldSafari: true
            }
        }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Safari['5.0']
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

    it('sends default header for 5.0 if oldSafari = false', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Safari['5.0']
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
});
