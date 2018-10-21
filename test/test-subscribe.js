describe('webos-service-stub subscribe', () => {
    let stub;
    beforeEach(() => stub = createService('test-service'));
    afterEach(() => stub && destroyService(stub));
    it('triggers the request event', (done) => {
        const e = stub.register('/test', () => done());
        stub.subscribe('luna://test-service/test', { subscribe: true });
    });
    it('triggers the request event with correct message parameter', (done) => {
        const e = stub.register('/test', (message) => {
            expect(message).to.be.an('object').that.has.keys([
                'payload', 'method', 'isSubscription', 'category', 'uniqueToken', 'token', 'sender',
                'ls2Message', 'activityManager', 'service', 'activity', 'respond', 'cancel',
            ])
            expect(message.payload).to.deep.equal(({ subscribe: true }));
            expect(message.method).to.equal('/test');
            expect(message.isSubscription).to.equal(true);
            expect(message.category).to.equal('/');
            expect(message.uniqueToken).to.be.a('string').that.is.not.empty;
            expect(message.token).to.be.a('number').that.is.greaterThan(0);
            expect(message.sender).to.equal('test-service');
            expect(message.ls2Message).to.deep.equal(({ }));
            expect(message.activityManager).to.be.an('object').that.has.keys(['create', 'complete']);
            expect(message.service).to.deep.equal(({ }));
            expect(message.activity).to.deep.equal(({ }));
            expect(message.respond).to.be.a('function');
            expect(message.cancel).to.be.a('function');
            done();
        });
        stub.subscribe('luna://test-service/test', { subscribe: true });
    });
    it('triggers the request event with correct message.payload', (done) => {
        const e = stub.register('/test', ({ payload }) => {
            expect(payload).to.deep.equal({ test: true, subscribe: true });
            done();
        });
        stub.subscribe('luna://test-service/test', { test: true, subscribe: true });
    });
    it('emitter response event is triggered by message.respond', (done) => {
        stub.register('/test', (message) => message.respond({}));
        const e = stub.subscribe('luna://test-service/test', { subscribe: true });
        e.on('response', () => done());
    });
    it('default behavior for unknown service calls returns { returnValue: true }', (done) => {
        delete process.env.FAIL_UNKNOWN_LUNA_SERVICES;
        const e = stub.subscribe('bad-service-name', { subscribe: true });
        e.on('response', ({ payload }) => {
            expect(payload).to.deep.equal({ returnValue: true, subscribed: true });
            done();
        });
    });
    it('setting environment FAIL_UNKNOWN_LUNA_SERVICES causes unknown service calls to error', (done) => {
        process.env.FAIL_UNKNOWN_LUNA_SERVICES = '1';
        const e = stub.subscribe('luna://bad-service-name', { subscribe: true });
        e.on('response', ({ payload }) => {
            expect(payload).to.deep.equal({
                returnValue: false,
                errorCode: -1,
                errorText: 'Service does not exist: bad-service-name.',
                subscribed: false,
            });
            delete process.env.FAIL_UNKNOWN_LUNA_SERVICES;
            done();
        });
    });
    it('multiple calls to message.respond are received at the emitter', (done) => {
        let counter = 0;
        stub.register('/ping', (message) => {
            const interval = setInterval(() => {
                if(++counter <= 5)
                    message.respond({ pong: true });
                else clearInterval(interval);
            }, 50);
        });
        const e = stub.subscribe('luna://test-service/ping', { subscribe: true });
        e.on('response', ({ payload }) => {
            if (payload.pong === true && counter >= 5) {
                done();
            }
        });
    });
    it('register cancel event is called when subscription is cancelled by end client', (done) => {
        stub.register('/test', (message) => {}, (cancelMessage) => {
            expect(cancelMessage).to.be.an('object').that.has.keys([
                'payload', 'method', 'isSubscription', 'category', 'uniqueToken', 'token', 'sender',
                'ls2Message', 'activityManager', 'service', 'activity', 'respond', 'cancel',
            ]);
            expect(cancelMessage.payload).to.deep.equal({ subscribe: true });
            expect(cancelMessage.method).to.equal('/test');
            expect(cancelMessage.isSubscription).to.equal(true);
            expect(cancelMessage.uniqueToken).to.be.a('string').that.is.not.empty;
            expect(cancelMessage.token).to.be.a('number');
            expect(cancelMessage.sender).to.equal('test-service');
            expect(cancelMessage.ls2Message).to.deep.equal(({ }));
            expect(cancelMessage.activityManager).to.be.an('object').that.has.keys([
                'create', 'complete'
            ]);
            expect(cancelMessage.service).to.deep.equal(({ }));
            expect(cancelMessage.activity).to.deep.equal(({ }));
            expect(cancelMessage.respond).to.be.a('function');
            expect(cancelMessage.cancel).to.be.a('function');
            done();
        });
        const e = stub.subscribe('luna://test-service/test', { subscribe: true });
        setTimeout(() => e.cancel(), 100);
    });
    it('service cancelling user subscription triggers cancel event on subscription emitter', (done) => {
        stub.register('/test', (message) => { setTimeout(() => message.cancel({ subscribed: false }), 100); });
        const e = stub.subscribe('luna://test-service/test', { subscribe: true });
        e.on('response', () => assert.fail());
        e.on('cancel', ({ payload }) => {
            expect(payload.subscribed).to.equal(false);
            done();
        });
    });
    it('service responding with subscribed: false in payload auto-cancels subscription', (done) => {
        stub.register('/test', (message) => message.respond({ subscribed: false }));
        const e = stub.subscribe('luna://test-service/test', { subscribe: true });
        e.on('response', () => assert.fail());
        e.on('cancel', ({ payload }) => {
            expect(payload.subscribed).to.equal(false);
            done();
        });
    });
});
