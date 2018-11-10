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
    describe('find', () => {
        it('find with watch returns original result, and later a fired when a new object is put', (done) => {
            callService(
                'luna://db/put',
                {
                    objects: [
                        { _kind: 'db-test-kind:1', test: false, ping: 'ping' }
                    ]
                }
            )
            .then(() => {
                const sub = subscribeService('luna://db/find', { query: { from: 'db-test-kind:1' }, watch: true });
                let responseCounter = 0;
                sub.on('response', ({ payload }) => {
                    responseCounter++;
                    if (responseCounter === 1) {
                        expect(payload).to.be.an('object').that.has.keys(['results', 'returnValue']);
                        const { results: [ res ] } = payload;
                        expect(res).to.be.an('object').that.has.keys(['_kind', 'test', 'ping', '_id', '_rev']);
                        expect(res.test).to.equal(false);
                        expect(res.ping).to.equal('ping');
                    } else if (responseCounter === 2) {
                        expect(payload).to.deep.equal({
                            returnValue: true,
                            fired: true,
                            subscribe: false,
                        });
                        done();
                    }
                });
                return sub;
            })
            .then(() => {
                return callService(
                    'luna://db/put',
                    {
                        objects: [
                            { _kind: 'db-test-kind:1', test: true, ping: 'pong' }
                        ]
                    }
                );
            });
        });
    });
    describe('del // TODO', () => {});
    describe('put // TODO', () => {});
    describe('merge // TODO', () => {});
    describe('mergePut // TODO', () => {});
    describe('dump // TODO', () => {});
    describe('load // TODO', () => {});
    describe('watch', () => {
        it('watch without query errors -986', () => {
            return callService('luna://db/watch', {})
            .then((x) => assert.fail(`watch returned ${x}`))
            .catch(err => expect(err).to.deep.equal({
                errorCode: -986,
                returnValue: false,
                errorText: "required prop not found: 'query'",
            }));
        });
        it('watch on data that already satisfies condition returns fired immediately', () => {
            return callService(
                'luna://db/put',
                {
                    objects: [
                        { _kind: 'db-test-kind:1', test: true, ping: 'pong' }
                    ]
                }
            )
            .then(() => callService(
                'luna://db/watch',
                {
                    query: { from: 'db-test-kind:1' },
                }
            ))
            .then((x) => expect(x).to.deep.equal({
                subscribe: false,
                returnValue: true,
                fired: true,
            }));
        });
        it('watch on data that doesnt already satisfy condition returns only returnValue', () => {
            return callService(
                'luna://db/watch',
                {
                    query: { from: 'db-test-kind:2' },
                }
            )
            .then((x) => expect(x).to.deep.equal({ returnValue: true }));
        });
        it('watch on data that exists later returns a fired value on the subscription object', (done) => {
            const sub = subscribeService(
                'luna://db/watch',
                {
                    query: { from: 'db-test-kind:3' },
                    watch: true,
                }
            );
            let responseCounter = 0;
            sub.on('response', ({ payload }) => {
                responseCounter++;
                if (responseCounter === 1) {
                    expect(payload).to.deep.equal({ returnValue: true });
                } else if (responseCounter === 2) {
                    expect(payload).to.deep.equal({
                        returnValue: true,
                        subscribe: false,
                        fired: true,
                    });
                    done();
                } else {
                    assert.fail(`* responseCounter=${responseCounter} payload=${JSON.stringify(payload)}`);
                }
            });
            callService(
                'luna://db/put',
                {
                    objects: [
                        { _kind: 'db-test-kind:3', test: true, ping: 'pong' }
                    ]
                }
            );
        });
        it('watch on queried data only returns for values that match the query', (done) => {
            const sub1 = subscribeService(
                'luna://db/watch',
                {
                    query: { from: 'db-test-kind:4', where: [{ prop:'test', op:'=', val:true}] },
                    watch: true,
                }
            );
            const sub2 = subscribeService(
                'luna://db/watch',
                {
                    query: { from: 'db-test-kind:4', where: [{ prop: 'test', op: '=', val: false }] },
                    watch: true,
                }
            );
            let rc1 = 0;
            sub1.on('response', ({ payload }) => {
                rc1++;
                if (rc1 === 1) {
                    expect(payload).to.deep.equal({ returnValue: true });
                } else {
                    assert.fail(`* rc1=${rc1} payload=${JSON.stringify(payload)}`);
                }
            });
            let responseCounter = 0;
            sub2.on('response', ({ payload }) => {
                responseCounter++;
                if (responseCounter === 1) {
                    expect(payload).to.deep.equal({ returnValue: true });
                } else if (responseCounter === 2) {
                    expect(payload).to.deep.equal({
                        returnValue: true,
                        subscribe: false,
                        fired: true,
                    });
                    done();
                } else {
                    assert.fail(`* responseCounter=${responseCounter} payload=${JSON.stringify(payload)}`);
                }
            });
            callService(
                'luna://db/put',
                {
                    objects: [
                        { _kind: 'db-test-kind:4', test: false, ping: 'pong' }
                    ]
                }
            );
        });
    });
});
