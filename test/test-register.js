describe('webos-service-stub register', () => {
    let stub;
    beforeEach(() => stub = createService('test-service'));
    afterEach(() => stub && destroyService(stub));
    it('returns an emitter', () => {
        const EventEmitter = require('events');
        const e = stub.register('/test');
        expect(e instanceof EventEmitter).to.equal(true);
    });
    it('with a callback function registers a handler to the request event', (done) => {
        const e = stub.register('/test', () => done());
        e.emit('request');
    });
    it('with a cancel function registers a handler to the cancel event', (done) => {
        const e = stub.register('/test', undefined, () => done());
        e.emit('cancel');
    });
});
