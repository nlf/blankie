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

describe('Firefox', () => {

    it('sends defaults for firefox > 23', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['24.0']
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

    it('sends firefox specific headers for >= 5 < 24', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['23.0']
                }
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.contain('default-src \'none\'');
                expect(res.headers['x-content-security-policy']).to.contain('script-src \'self\'');
                expect(res.headers['x-content-security-policy']).to.contain('style-src \'self\'');
                expect(res.headers['x-content-security-policy']).to.contain('img-src \'self\'');
                expect(res.headers['x-content-security-policy']).to.contain('xhr-src \'self\'');
                done();
            });
        });
    });

    it('sends allow instead of default-src for firefox 4', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['4.0']
                }
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.contain('allow \'none\'');
                expect(res.headers['x-content-security-policy']).to.contain('script-src \'self\'');
                expect(res.headers['x-content-security-policy']).to.contain('style-src \'self\'');
                expect(res.headers['x-content-security-policy']).to.contain('img-src \'self\'');
                expect(res.headers['x-content-security-policy']).to.contain('xhr-src \'self\'');
                done();
            });
        });
    });

    it('sends defaults for firefox < 4', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['3.0']
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

    it('replaces unsafe-inline with inline-script for older firefox', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                scriptSrc: 'unsafe-inline'
            }
        }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['22.0']
                }
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.contain('script-src \'inline-script\'');
                done();
            });
        });
    });

    it('replaces unsafe-eval with eval-script for older firefox', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                scriptSrc: 'unsafe-eval'
            }
        }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['22.0']
                }
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.contain('script-src \'eval-script\'');
                done();
            });
        });
    });

    it('removes unsafe-eval from non script-src directives', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                objectSrc: ['unsafe-inline', 'unsafe-eval', 'self']
            }
        }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['22.0']
                }
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.contain('object-src \'self\'');
                done();
            });
        });
    });

    it('doesnt set empty strings if invalid values are all removed', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                objectSrc: ['unsafe-inline', 'unsafe-eval']
            }
        }], (err) => {

            expect(err).to.not.exist();
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['22.0']
                }
            }, (res) => {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.not.contain('object-src');
                done();
            });
        });
    });
});
