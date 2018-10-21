describe('internal interfaces to ServiceStub', () => {
    let stub;
    beforeEach(() => stub = createService('test-service'));
    afterEach(() => stub && destroyService(stub));
    describe('ServiceStub', () => {
        it('constructs and maps into services list', () => {
            expect(stub instanceof ServiceStub).to.be.true;
            expect(stub.stubMethods).to.be.an('object');
            expect(stub.stubMethods['test-service']).to.deep.equal(({ }));
        });
        it('unregisterService works', (done) => {
            stub.unregisterService();
            setTimeout(() => {
                expect(stub.stubMethods['test-service']).to.equal(undefined);
                done();
            }, 100);
        });
        it('object contains correct properties', () => {
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
        it('noBuiltInMethods defaults to undefined', () => {
            expect(stub.noBuiltInMethods).to.equal(undefined);
        });
        it('stores valid options', () => {
            const x = new ServiceStub('test-service', undefined, { noBuiltInMethods: true });
            expect(x.noBuiltInMethods).to.equal(true);
        });
    });
});
