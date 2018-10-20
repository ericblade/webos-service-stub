const ServiceStub = require('../lib/ServiceStub');
const Service = require('..');

const { expect } = require('chai');

describe('ServiceStub', () => {
    let stub;
    beforeEach(() => stub = new ServiceStub('test-service'));
    afterEach(() => stub && stub.unregisterService());
    describe('internal interfaces', () => {
        it('ServiceStub constructs and maps into services list', () => {
            expect(stub instanceof ServiceStub).to.be.true;
            expect(stub.stubMethods).to.be.an('object');
            expect(stub.stubMethods['test-service']).to.deep.equal(({ }));
        });
        it('ServiceStub unregister works', (done) => {
            stub.unregisterService();
            setTimeout(() => {
                expect(stub.stubMethods['test-service']).to.equal(undefined);
                done();
            }, 100);
        });
        it('ServiceStub object contains correct properties', () => {
            expect(stub.busId).to.equal('test-service');
            expect(stub.stubMethods).to.be.an('object');
            expect(stub.stubMethods['test-service']).to.deep.equal(({ }));
            expect(stub.webOS).to.be.true;
            expect(stub.webOSSimulation).to.be.true;
            expect(stub.activityManager).to.be.an('object').that.has.keys([
                'create',
                'complete',
            ]);
        });
        it('ServiceStub noBuiltInMethods defaults to undefined', () => {
            expect(stub.noBuiltInMethods).to.equal(undefined);
        });
        it('ServiceStub stores valid options', () => {
            const x = new ServiceStub('test-service', undefined, { noBuiltInMethods: true });
            expect(x.noBuiltInMethods).to.equal(true);
        });
    });
});

describe('webos-service-stub', () => {
    let stub;
    beforeEach(() => stub = new Service('test-service-stub'));
    afterEach(() => stub && stub.quit());
    it('register returns an emitter', () => {
        const EventEmitter = require('events');
        const e = stub.register('/test');
        expect(e instanceof EventEmitter).to.equal(true);
    });
    it('register with a callback function registers a handler to the request event', (done) => {
        const e = stub.register('/test', () => done());
        e.emit('request');
    });
    it('register with a cancel function registers a handler to the cancel event', (done) => {
        const e = stub.register('/test', undefined, () => done());
        e.emit('cancel');
    });
    // TODO: test that the internal data structures after performing a /register are correct
    it('call triggers the request event', (done) => {
        const e = stub.register('/test', () => done());
        stub.call('luna://test-service-stub/test', {});
    });
    it('call triggers the request event with correct message parameter', (done) => {
        const e = stub.register('/test', (message) => {
            expect(message).to.be.an('object').that.has.keys([
                'payload', 'method', 'isSubscription', 'category', 'uniqueToken', 'token', 'sender',
                'ls2Message', 'activityManager', 'service', 'activity', 'respond', 'cancel',
            ])
            expect(message.payload).to.deep.equal(({ }));
            expect(message.method).to.equal('/test');
            expect(message.isSubscription).to.equal(false);
            expect(message.category).to.equal('/');
            expect(message.uniqueToken).to.be.a('string').that.is.not.empty;
            expect(message.token).to.be.a('number').that.is.greaterThan(0);
            expect(message.sender).to.equal('test-service-stub');
            expect(message.ls2Message).to.deep.equal(({ }));
            expect(message.activityManager).to.be.an('object').that.has.keys(['create', 'complete']);
            expect(message.service).to.deep.equal(({ }));
            expect(message.activity).to.deep.equal(({ }));
            expect(message.respond).to.be.a('function');
            expect(message.cancel).to.be.a('function');
            done();
        });
        stub.call('luna://test-service-stub/test', {});
    });
    it('call triggers the request event with correct message.payload', (done) => {
        const e = stub.register('/test', ({ payload }) => {
            expect(payload).to.deep.equal({ test: true });
            done();
        });
        stub.call('luna://test-service-stub/test', { test: true });
    });
    it('call callback is called by message.respond', (done) => {
        stub.register('/test', (message) => message.respond());
        stub.call('luna://test-service-stub/test', {}, () => done());
    });
    it('default behavior for unknown service calls returns { returnValue: true }', (done) => {
        delete process.env.FAIL_UNKNOWN_LUNA_SERVICES;
        stub.call('bad-service-name', {}, ({ payload }) => {
            expect(payload).to.deep.equal({ returnValue: true });
            done();
        });
    });
    it('setting environment FAIL_UNKNOWN_LUNA_SERVICES causes unknown service calls to error', (done) => {
        process.env.FAIL_UNKNOWN_LUNA_SERVICES = '1';
        stub.call('luna://bad-service-name', {}, ({ payload }) => {
            expect(payload).to.deep.equal({
                returnValue: false,
                errorCode: -1,
                errorText: 'Service does not exist: bad-service-name.',
            });
            done();
        });
    });
    // TODO: copy all the 'call' tests to also test 'subscribe'
    // TODO: also test that register's cancelCallback and the emitter's 'cancel' event is triggered
    // when a client calls cancel()
    // TODO: test calling between two different stub objects
    // TODO: also test callMethod and subscribeMethod
    it('callPromise returns a Promise', () => {
        const p = stub.callPromise('luna://test-service-stub/test', {}).catch(() => {});
        expect(p instanceof Promise).to.equal(true);
    });
    it('callPromise resolves when message.respond is called with returnValue: true', (done) => {
        stub.register('/test', (message) => message.respond({ returnValue: true }));
        stub.callPromise('luna://test-service-stub/test', {})
        .then(() => done());
    });
    it('callPromise rejects when message.respond is called with returnValue: false', (done) => {
        stub.register('/test', (message) => message.respond({ returnValue: false }));
        stub.callPromise('luna://test-service-stub/test', {})
        .then(() => assert.fail())
        .catch(() => done());
    });
    it('callPromise resolves with the payload from message.respond', (done) => {
        stub.register('/test', (message) => message.respond({ test: true, returnValue: true }));
        stub.callPromise('luna://test-service-stub/test', {})
        .then((payload) => {
            expect(payload).to.deep.equal({ test: true, returnValue: true });
            done();
        });
    });
    it('callPromise rejects with the payload from message.respond', (done) => {
        stub.register('/test', (message) => message.respond({ test: true, returnValue: false }));
        stub.callPromise('luna://test-service-stub/test', {})
        .then(() => assert.fail())
        .catch((payload) => {
            expect(payload).to.deep.equal({ test: true, returnValue: false });
            done();
        });
    });
});