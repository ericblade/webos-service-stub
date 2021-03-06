const DatabaseStub = require('../lib/DatabaseStub');

describe('DatabaseStub', () => {
    let stub;
    beforeEach(() => stub = new DatabaseStub('db'));
    describe('unimplemented functions return unimplemented error', () => {
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
        const random = (min, max) => Math.floor(Math.random() * (max - min) ) + min;
        it('find with incDel=false does not return deleted objects', () => {
            const promises = [];
            for (let x = 0; x < 10; x++) {
                promises.push(callService('luna://db/put', { objects: [{ _kind: 'db-test-kind:1', test: x }] }));
            }
            return Promise.all(promises)
            .then((pResults) => {
                const [id0, id1, id2, ...ids] = pResults.map((pr) => (pr.results[0].id));
                callService('luna://db/del', { ids, purge: false });
            })
            .then(() => callService('luna://db/find', { query: { from: 'db-test-kind:1', select: ['test'] } }))
            .then(({ results }) => expect(results).to.be.an('array').with.lengthOf(3));
        });
        it('find with incDel=true does return deleted objects', () => {
            const promises = [];
            for (let x = 0; x < 10; x++) {
                promises.push(callService('luna://db/put', { objects: [{ _kind: 'db-test-kind:1', test: x }] }));
            }
            return Promise.all(promises)
                .then((pResults) => {
                    const [id0, id1, id2, ...ids] = pResults.map((pr) => (pr.results[0].id));
                    callService('luna://db/del', { ids, purge: false });
                })
                .then(() => callService('luna://db/find', { query: { from: 'db-test-kind:1', select: ['test'], incDel: true } }))
                .then(({ results }) => expect(results).to.be.an('array').with.lengthOf(10));
        });
        it('find with select returns only the specified fields', () => {
            const promises = [];
            for (let x = 0; x < 10; x++) {
                promises.push(callService('luna://db/put', { objects: [{ _kind: 'db-test-kind:1', test: x }] }));
            }
            return Promise.all(promises)
            .then(() => (
                callService('luna://db/find', { query: { from: 'db-test-kind:1', select: ['test'] } })
            ))
            .then(({ results }) => {
                expect(results).to.deep.equal([
                    { test: 0 },
                    { test: 1 },
                    { test: 2 },
                    { test: 3 },
                    { test: 4 },
                    { test: 5 },
                    { test: 6 },
                    { test: 7 },
                    { test: 8 },
                    { test: 9 },
                ]);
            });
        });
        // TODO: test select with multiple fields
        it('find with orderBy', () => {
            const promises = [];
            for (let x = 0; x < 20; x++) {
                promises.push(callService('luna://db/put', { objects: [{ _kind: 'db-test-kind:1', test: random(1, 50) }] }));
            }
            return Promise.all(promises)
            .then(() => (
                callService('luna://db/find', { query: { from: 'db-test-kind:1', orderBy: 'test' } })
            ))
            .then(({ results }) => {
                expect(results[0].test).to.be.at.most(results[1].test);
                expect(results[1].test).to.be.at.most(results[2].test);
                expect(results[0].test).to.be.at.most(results[19].test);
                expect(results[1].test).to.be.at.most(results[19].test);
            });
        });
        it('find with orderBy descending', () => {
            const promises = [];
            for (let x = 0; x < 20; x++) {
                promises.push(callService('luna://db/put', { objects: [{ _kind: 'db-test-kind:1', test: random(1, 50) }] }));
            }
            return Promise.all(promises)
            .then(() => (
                callService('luna://db/find', { query: { from: 'db-test-kind:1', orderBy: 'test', desc: true } })
            ))
            .then(({ results }) => {
                expect(results[0].test).to.be.at.least(results[1].test);
                expect(results[1].test).to.be.at.least(results[2].test);
                expect(results[0].test).to.be.at.least(results[19].test);
                expect(results[1].test).to.be.at.least(results[19].test);
            });
        });
        // TODO: should probably write orderBy tests with non-numerical sorting
        it('find with limit returns only the specified limit number of items', () => {
            const promises = [];
            for(let x = 0; x < 20; x++) {
                promises.push(callService('luna://db/put', { objects: [ { _kind: 'db-test-kind:1', test: x }]}));
            }
            return Promise.all(promises)
            .then(() => (
                callService('luna://db/find', { query: { from: 'db-test-kind:1', limit: 5 } })
            ))
            .then((x) => {
                expect(x).to.be.an('object').that.has.keys([ 'results', 'next', 'returnValue' ]);
                expect(x.results).to.be.an('array').that.has.lengthOf(5);
                expect(x.next).to.be.a('string').that.is.not.empty;
                expect(x.returnValue).to.equal(true);
                const [ test0, test1, test2, test3, test4 ] = x.results;
                expect(test0.test).to.equal(0);
                expect(test1.test).to.equal(1);
                expect(test2.test).to.equal(2);
                expect(test3.test).to.equal(3);
                expect(test4.test).to.equal(4);
            });
        });
        it('find with limit 0 returns empty results', () => {
            const promises = [];
            for (let x = 0; x < 20; x++) {
                promises.push(callService('luna://db/put', { objects: [{ _kind: 'db-test-kind:1', test: x }] }));
            }
            return Promise.all(promises)
                .then(() => (
                    callService('luna://db/find', { query: { from: 'db-test-kind:1', limit: 0 } })
                ))
                .then((x) => {
                    expect(x).to.be.an('object').that.has.keys(['results', 'returnValue']);
                    expect(x.results).to.be.an('array').that.has.lengthOf(0);
                    expect(x.returnValue).to.equal(true);
                });
        });
        it('find with limit 0 and count returns empty results with proper count', () => {
            const promises = [];
            for (let x = 0; x < 20; x++) {
                promises.push(callService('luna://db/put', { objects: [{ _kind: 'db-test-kind:1', test: x }] }));
            }
            return Promise.all(promises)
                .then(() => (
                    callService('luna://db/find', { query: { from: 'db-test-kind:1', limit: 0 }, count: true })
                ))
                .then((x) => {
                    expect(x).to.be.an('object').that.has.keys(['results', 'count', 'returnValue']);
                    expect(x.results).to.be.an('array').that.has.lengthOf(0);
                    expect(x.count).to.equal(20);
                    expect(x.returnValue).to.equal(true);
                });
        });
        // TODO: find out what happens both here and on a live device, if you attempt to merge or
        // mergePut with a query with limit!
        // TODO: add a test for the 500 limit cap
        it('find with limit 5 and count returns empty results with proper count', () => {
            const promises = [];
            for (let x = 0; x < 20; x++) {
                promises.push(callService('luna://db/put', { objects: [{ _kind: 'db-test-kind:1', test: x }] }));
            }
            return Promise.all(promises)
                .then(() => (
                    callService('luna://db/find', { query: { from: 'db-test-kind:1', limit: 5 }, count: true })
                ))
                .then((x) => {
                    expect(x).to.be.an('object').that.has.keys(['results', 'count', 'next', 'returnValue']);
                    expect(x.results).to.be.an('array').that.has.lengthOf(5);
                    expect(x.next).to.be.a('string').that.is.not.empty;
                    expect(x.count).to.equal(20);
                    expect(x.returnValue).to.equal(true);
                });
        });
        it('find with page returns a given page', () => {
            const promises = [];
            for (let x = 0; x < 20; x++) {
                promises.push(callService('luna://db/put', { objects: [{ _kind: 'db-test-kind:1', test: x }] }));
            }
            return Promise.all(promises)
            .then(() => (
                callService('luna://db/find', { query: { from: 'db-test-kind:1', limit: 5 } })
            ))
            .then(({ next }) => (
                callService('luna://db/find', { query: { page: next } })
            ))
            .then((x) => {
                expect(x).to.be.an('object').that.has.keys(['results', 'next', 'returnValue']);
                expect(x.results).to.be.an('array').that.has.lengthOf(5);
                expect(x.next).to.be.a('string').that.is.not.empty;
                expect(x.returnValue).to.equal(true);
                const [test0, test1, test2, test3, test4] = x.results;
                expect(test0.test).to.equal(5);
                expect(test1.test).to.equal(6);
                expect(test2.test).to.equal(7);
                expect(test3.test).to.equal(8);
                expect(test4.test).to.equal(9);
            });
        });
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
    describe('batch // TODO', () => {});
    describe('compact // TODO', () => {});
    describe('purge // TODO', () => {});
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
