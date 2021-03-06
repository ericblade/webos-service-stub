describe('webos-service-stub callPromise', () => {
    let stub;
    beforeEach(() => stub = createService('test-service'));
    afterEach(() => stub && destroyService(stub));
    it('returns a Promise', () => {
        const p = stub.callPromise('luna://test-service/test', {}).catch(() => {});
        expect(p instanceof Promise).to.equal(true);
    });
    it('resolves when message.respond is called with returnValue: true', (done) => {
        stub.register('/test', (message) => message.respond({ returnValue: true }));
        stub.callPromise('luna://test-service/test', {})
        .then(() => done());
    });
    it('rejects when message.respond is called with returnValue: false', (done) => {
        stub.register('/test', (message) => message.respond({ returnValue: false }));
        stub.callPromise('luna://test-service/test', {})
        .then(() => assert.fail())
        .catch(() => done());
    });
    it('resolves with the payload from message.respond', (done) => {
        stub.register('/test', (message) => message.respond({ test: true, returnValue: true }));
        stub.callPromise('luna://test-service/test', {})
        .then((payload) => {
            expect(payload).to.deep.equal({ test: true, returnValue: true });
            done();
        });
    });
    it('rejects with the payload from message.respond', (done) => {
        stub.register('/test', (message) => message.respond({ test: true, returnValue: false }));
        stub.callPromise('luna://test-service/test', {})
        .then(() => assert.fail())
        .catch((payload) => {
            expect(payload).to.deep.equal({ test: true, returnValue: false });
            done();
        });
    });
});
