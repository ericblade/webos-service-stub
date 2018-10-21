describe('webos-service-stub call', () => {
    let stub;
    beforeEach(() => stub = createService('test-service'));
    afterEach(() => stub && destroyService(stub));
    it('triggers the request event', (done) => {
        const e = stub.register('/test', () => done());
        stub.call('luna://test-service/test', {});
    });
    it('triggers the request event with correct message parameter', (done) => {
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
            expect(message.sender).to.equal('test-service');
            expect(message.ls2Message).to.deep.equal(({ }));
            expect(message.activityManager).to.be.an('object').that.has.keys(['create', 'complete']);
            expect(message.service).to.deep.equal(({ }));
            expect(message.activity).to.deep.equal(({ }));
            expect(message.respond).to.be.a('function');
            expect(message.cancel).to.be.a('function');
            done();
        });
        stub.call('luna://test-service/test', {});
    });
    it('triggers the request event with correct message.payload', (done) => {
        const e = stub.register('/test', ({ payload }) => {
            expect(payload).to.deep.equal({ test: true });
            done();
        });
        stub.call('luna://test-service/test', { test: true });
    });
    it('callback is called by message.respond', (done) => {
        stub.register('/test', (message) => message.respond());
        stub.call('luna://test-service/test', {}, () => done());
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
    it('calling between multiple stub objects is successful', (done) => {
        const serviceA = stub;
        const serviceB = createService('test-service-b');
        let aReceivedCall = false;
        let bReceivedCall = false;
        serviceA.register('/testA', (message) => {
            aReceivedCall = true;
            if (bReceivedCall) {
                done();
            }
        });
        serviceB.register('/testB', (message) => {
            bReceivedCall = true;
            if (aReceivedCall) {
                done();
            }
        });
        serviceB.call('luna://test-service/testA', {});
        serviceA.call('luna://test-service-b/testB', {});
    });
});
