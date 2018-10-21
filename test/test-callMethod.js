describe('webos-service-stub callMethod', () => {
    let stub;
    beforeEach(() => stub = createService('test-service'));
    afterEach(() => stub && destroyService(stub));
    it('returns a Promise', () => {
        const p = stub.callMethod('/test', {}).catch(() => { });
        expect(p instanceof Promise).to.equal(true);
    });
    it('resolves when message.respond is called with returnValue: true', (done) => {
        stub.register('/test', (message) => message.respond({ returnValue: true }));
        stub.callMethod('/test', {})
            .then(() => done());
    });
    it('rejects when message.respond is called with returnValue: false', (done) => {
        stub.register('/test', (message) => message.respond({ returnValue: false }));
        stub.callMethod('/test', {})
            .then(() => assert.fail())
            .catch(() => done());
    });
    it('resolves with the payload from message.respond', (done) => {
        stub.register('/test', (message) => message.respond({ test: true, returnValue: true }));
        stub.callMethod('/test', {})
            .then((payload) => {
                expect(payload).to.deep.equal({ test: true, returnValue: true });
                done();
            });
    });
    it('rejects with the payload from message.respond', (done) => {
        stub.register('/test', (message) => message.respond({ test: true, returnValue: false }));
        stub.callMethod('/test', {})
            .then(() => assert.fail())
            .catch((payload) => {
                expect(payload).to.deep.equal({ test: true, returnValue: false });
                done();
            });
    });
});
