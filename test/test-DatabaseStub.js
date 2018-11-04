const DatabaseStub = require('../lib/DatabaseStub');

describe('DatabaseStub', () => {
    let stub;
    beforeEach(() => stub = new DatabaseStub('db'));
    describe('unimplemented functions return unimplemented error', () => {
        it('/batch', () => {
            return callService('luna://db/batch', {})
                .then(x => assert.fail())
                .catch(x => expect(x).to.deep.equal({
                    returnValue: false,
                    message: '/batch not implemented',
                }));
        });
        it('/compact', () => {
            return callService('luna://db/compact', {})
                .then(x => assert.fail())
                .catch(x => expect(x).to.deep.equal({
                    returnValue: false,
                    message: '/compact not implemented',
                }));
        });
        it('/delKind', () => {
            return callService('luna://db/delKind', {})
                .then(x => assert.fail())
                .catch(x => expect(x).to.deep.equal({
                    returnValue: false,
                    message: '/delKind not implemented',
                }));
        });
        it('/getProfile', () => {
            return callService('luna://db/getProfile', {})
                .then(x => assert.fail())
                .catch(x => expect(x).to.deep.equal({
                    returnValue: false,
                    message: '/getProfile not implemented',
                }));
        });
        it('/profile', () => {
            return callService('luna://db/profile', {})
                .then(x => assert.fail())
                .catch(x => expect(x).to.deep.equal({
                    returnValue: false,
                    message: '/profile not implemented',
                }));
        });
        it('/purge', () => {
            return callService('luna://db/purge', {})
                .then(x => assert.fail())
                .catch(x => expect(x).to.deep.equal({
                    returnValue: false,
                    message: '/purge not implemented',
                }));
        });
        it('/purgeStatus', () => {
            return callService('luna://db/purgeStatus', {})
                .then(x => assert.fail())
                .catch(x => expect(x).to.deep.equal({
                    returnValue: false,
                    message: '/purgeStatus not implemented',
                }));
        });
        it('/putKind', () => {
            return callService('luna://db/putKind', {})
                .then(x => assert.fail())
                .catch(x => expect(x).to.deep.equal({
                    returnValue: false,
                    message: '/putKind not implemented',
                }));
        });
        it('/putPermissions', () => {
            return callService('luna://db/putPermissions', {})
                .then(x => assert.fail())
                .catch(x => expect(x).to.deep.equal({
                    returnValue: false,
                    message: '/putPermissions not implemented',
                }));
        });
        it('/putQuotas', () => {
            return callService('luna://db/putQuotas', {})
                .then(x => assert.fail())
                .catch(x => expect(x).to.deep.equal({
                    returnValue: false,
                    message: '/putQuotas not implemented',
                }));
        });
        it('/quotaStats', () => {
            return callService('luna://db/quotaStats', {})
                .then(x => assert.fail())
                .catch(x => expect(x).to.deep.equal({
                    returnValue: false,
                    message: '/quotaStats not implemented',
                }));
        });
        it('/removeAppData', () => {
            return callService('luna://db/removeAppData', {})
                .then(x => assert.fail())
                .catch(x => expect(x).to.deep.equal({
                    returnValue: false,
                    message: '/removeAppData not implemented',
                }));
        });
        it('/search', () => {
            return callService('luna://db/search', {})
                .then(x => assert.fail())
                .catch(x => expect(x).to.deep.equal({
                    returnValue: false,
                    message: '/search not implemented',
                }));
        });
        it('/stats', () => {
            return callService('luna://db/stats', {})
                .then(x => assert.fail())
                .catch(x => expect(x).to.deep.equal({
                    returnValue: false,
                    message: '/stats not implemented',
                }));
        });
    });
    describe('reserveIds', () => {
        it('reserveIds', () => {
            return callService('luna://db/reserveIds', { count: 2 })
            .then((x) => {
                expect(x).to.be.an('object').with.keys(['ids', 'returnValue']);
                expect(x.ids).to.be.an('array').with.lengthOf(2);
                expect(x.ids[0]).to.be.a('string').that.is.not.empty;
                expect(x.ids[1]).to.be.a('string').that.is.not.empty;
            });
        });
        // TODO: does live db8 default to count=1?
        it('reserveIds defaults to count=1', () => {
            return callService('luna://db/reserveIds', {})
            .then((x) => {
                expect(x).to.be.an('object').with.keys(['ids', 'returnValue']);
                expect(x.ids).to.be.an('array').with.lengthOf(1);
                expect(x.ids[0]).to.be.a('string').that.is.not.empty;
            });
        });
    });
    describe('get // TODO', () => {});
    describe('find // TODO', () => {});
    describe('del // TODO', () => {});
    describe('put // TODO', () => {});
    describe('merge // TODO', () => {});
    describe('mergePut // TODO', () => {});
    describe('dump // TODO', () => {});
    describe('load // TODO', () => {});
    describe('watch // TODO', () => {});
});
