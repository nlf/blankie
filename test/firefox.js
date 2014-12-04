/* jshint -W030 */
var Agents = require('browser-agents');
var Blankie = require('../');
var Hapi = require('hapi');
var Scooter = require('scooter');

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var describe = lab.experiment;
var expect = Code.expect;
var it = lab.test;

var defaultRoute = {
    method: 'GET',
    path: '/',
    handler: function (request, reply) {

        reply('defaults');
    }
};

describe('Firefox', function () {

    it('sends defaults for firefox > 23', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['24.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                done();
            });
        });
    });

    it('sends firefox specific headers for >= 5 < 24', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['23.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';xhr-src \'self\'');
                done();
            });
        });
    });

    it('sends allow instead of default-src for firefox 4', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['4.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.equal('allow \'none\';script-src \'self\';style-src \'self\';img-src \'self\';xhr-src \'self\'');
                done();
            });
        });
    });

    it('sends defaults for firefox < 4', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, Blankie], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['3.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('content-security-policy');
                expect(res.headers['content-security-policy']).to.equal('default-src \'none\';script-src \'self\';style-src \'self\';img-src \'self\';connect-src \'self\'');
                done();
            });
        });
    });

    it('replaces unsafe-inline with inline-script for older firefox', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                scriptSrc: 'unsafe-inline'
            }
        }], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['22.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.equal('script-src \'inline-script\'');
                done();
            });
        });
    });

    it('replaces unsafe-eval with eval-script for older firefox', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                scriptSrc: 'unsafe-eval'
            }
        }], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['22.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.equal('script-src \'eval-script\'');
                done();
            });
        });
    });

    it('removes unsafe-eval from non script-src directives', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                objectSrc: ['unsafe-inline', 'unsafe-eval', 'self']
            }
        }], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['22.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.equal('object-src \'self\'');
                done();
            });
        });
    });

    it('doesnt set empty strings if invalid values are all removed', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.route(defaultRoute);
        server.register([Scooter, {
            register: Blankie,
            options: {
                objectSrc: ['unsafe-inline', 'unsafe-eval']
            }
        }], function (err) {

            expect(err).to.not.exist;
            server.inject({
                method: 'GET',
                url: '/',
                headers: {
                    'User-Agent': Agents.Firefox['22.0']
                }
            }, function (res) {

                expect(res.statusCode).to.equal(200);
                expect(res.headers).to.contain('x-content-security-policy');
                expect(res.headers['x-content-security-policy']).to.equal('');
                done();
            });
        });
    });
});
