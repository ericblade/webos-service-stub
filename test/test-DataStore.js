const fs = require('fs');
const DataStore = require('../lib/database/DataStore');

describe('Database DataStore', () => {
    describe('individual tests', () => {
        let dataStore;
        beforeEach(() => dataStore = new DataStore());
        describe('getCount', () => {
            it('getCount with empty database returns 0', () => {
                expect(dataStore.getCount()).to.equal(0);
            });
            it('getCount with 5 records returns 5', () => {
                dataStore.put([
                    { _kind: 'test-kind:1', name: 'test 1' },
                    { _kind: 'test-kind:1', name: 'test 2' },
                    { _kind: 'test-kind:1', name: 'test 3' },
                    { _kind: 'test-kind:1', name: 'test 4' },
                    { _kind: 'test-kind:1', name: 'test 5' },
                ]);
                expect(dataStore.getCount()).to.equal(5);
            });
        });
        describe('reserveIds', () => {
            it('reserveIds count 1 returns 1 id', () => {
                expect(dataStore.reserveIds(1)).to.be.an('array').with.lengthOf(1);
            });
            it('reserveIds count 0 returns 0 ids', () => {
                expect(dataStore.reserveIds(0)).to.be.an('array').with.lengthOf(0);
            });
            it('reserveIds with count 100 returns 100 ids', () => {
                expect(dataStore.reserveIds(100)).to.be.an('array').with.lengthOf(100);
            });
        });
        describe('get', () => {
            it('get with nothing in database returns empty array', () => {
                expect(dataStore.get(['invalidId'])).to.be.an('array').with.lengthOf(0);
            });
            it('get with a valid id returns proper data', () => {
                const [ { id } ] = dataStore.put([
                    { _kind: 'test-kind:1', name: 'test 1' },
                ]);
                const res = dataStore.get([id]);
                expect(res).to.be.an('array').with.lengthOf(1);
                const [ test ] = res;
                expect(test).to.be.an('object').that.has.keys([
                    '_kind', 'name', '_id', '_rev'
                ]);
                expect(test._kind).to.equal('test-kind:1');
                expect(test.name).to.equal('test 1');
                expect(test._id).to.be.a('string').that.is.not.empty;
                expect(test._rev).to.be.a('number');
            });
            // TODO: write a test with both valid and invalid ids.
            // TODO: check what the above mentioned test does on a real db8
            it('get with multiple valid ids returns proper data', () => {
                const [ { id: id1 }, { id: id2 } ] = dataStore.put([
                    { _kind: 'test-kind:1', name: 'test 1' },
                    { _kind: 'test-kind:1', name: 'test 2' },
                ]);
                const res = dataStore.get([ id1, id2 ]);
                expect(res).to.be.an('array').with.lengthOf(2);
                const [ test1, test2 ] = res;
                expect(test1).to.be.an('object').that.has.keys([
                    '_kind', 'name', '_id', '_rev'
                ]);
                expect(test2).to.be.an('object').that.has.keys([
                    '_kind', 'name', '_id', '_rev'
                ]);
                expect(test1.name).to.equal('test 1');
                expect(test2.name).to.equal('test 2');
                expect(test1._rev).to.be.lessThan(test2._rev);
            });
        });
        describe('del', () => {
            it('del on an empty database returns', () => {
                const test = dataStore.del([ 'invalidId' ]);
                expect(test).to.be.an('array').with.lengthOf(0);
            });
            it('del returns correct results for a single deletion', () => {
                const [ { id } ] = dataStore.put([
                    { _kind: 'test-kind:1', name: 'test 1' },
                ]);
                const res = dataStore.del([ id ]);
                expect(res).to.be.an('array').with.lengthOf(1);
                const [ test ] = res;
                expect(test).to.be.an('object').that.has.keys([
                    'id', 'rev'
                ]);
                expect(test.id).to.be.a('string').that.is.not.empty;
                expect(test.rev).to.be.a('number');
            });
            it('del returns correct results for multiple deletions', () => {
                const [ { id: id1 }, { id: id2 } ] = dataStore.put([
                    { _kind: 'test-kind:1', name: 'test 1' },
                    { _kind: 'test-kind:1', name: 'test 2' },
                ]);
                const res = dataStore.del([ id1, id2 ]);
                expect(res).to.be.an('array').with.lengthOf(2);
                const [ test1, test2 ] = res;
                expect(test1).to.be.an('object').that.has.keys([
                    'id', 'rev',
                ]);
                expect(test2).to.be.an('object').that.has.keys([
                    'id', 'rev',
                ]);
            });
        });
        describe('put', () => {
            it('errors -3969, kind not specified if _kind is not specified', () => {
                expect(dataStore.put([{ nokind: true }])).to.deep.equal({
                    errorCode: -3969,
                    errorText: 'db: kind not specified',
                    returnValue: false,
                });
            });
            it('a single put returns a length 1 array', () => {
                const res = dataStore.put([{ _kind: 'test:1' }]);
                expect(res).to.be.an('array').with.lengthOf(1);
                const [ test ] = res;
                expect(test).to.be.an('object').with.keys([
                    'id', 'rev',
                ]);
                expect(test.id).to.be.a('string').that.is.not.empty;
                expect(test.rev).to.be.a('number');
            });
            it('multiple puts returns corresponding length array', () => {
                const res = dataStore.put([
                    { _kind: 'test:1' },
                    { _kind: 'test:1' },
                ]);
                expect(res).to.be.an('array').with.lengthOf(2);
                const [ test1, test2 ] = res;
                expect(test1).to.be.an('object').with.keys([
                    'id', 'rev',
                ]);
                expect(test2).to.be.an('object').with.keys([
                    'id', 'rev',
                ]);
            });
            it('get retrieves objects that are put', () => {
                const obj = { _kind: 'test:1', test: true };
                const [{ id }] = dataStore.put([ obj ]);
                const [res] = dataStore.get([ id ]);
                expect(res).to.be.an('object').that.deep.equals(obj);
            });
        });
        describe('merge', () => {
            it('errors -3969 if objects are specified without _id fields', () => {
                const res = dataStore.merge([{ test: 1 }]);
                expect(res.errorCode).to.equal(-3969);
            });
            it('errors -3969 if any id in the list is not in the database', () => {
                const res = dataStore.merge([{ _id: 'testBadId' }]);
                expect(res.errorCode).to.equal(-3969);
            });
            it('successfully changes existing properties', () => {
                const [{ id, rev }] = dataStore.put([{ _kind: 'test:1', test: 1 }]);
                const res = dataStore.merge([{ _id: id, test: 3 }]);
                const [{ id: id2, rev: rev2 }] = res;
                expect(id2).to.equal(id);
                expect(rev2).to.be.greaterThan(rev);
                const [test] = dataStore.get([id]);
                expect(test).to.be.an('object').that.has.keys([
                    '_kind', 'test', '_id', '_rev',
                ]);
                expect(test._kind).to.equal('test:1');
                expect(test.test).to.equal(3);
                expect(test._id).to.equal(id);
                expect(test._rev).to.equal(rev2);
            });
            it('sucecssfully adds new properties', () => {
                const [{ id, rev }] = dataStore.put([{ _kind: 'test:1', test: 1 }]);
                const res = dataStore.merge([{ _id: id, b: 2 }]);
                const [{ id: id2, rev: rev2 }] = res;
                expect(id2).to.equal(id);
                expect(rev2).to.be.greaterThan(rev);
                const [test] = dataStore.get([id]);
                expect(test).to.be.an('object').that.has.keys([
                    '_kind', 'test', 'b', '_id', '_rev',
                ]);
                expect(test._kind).to.equal('test:1');
                expect(test.test).to.equal(1);
                expect(test.b).to.equal(2);
                expect(test._id).to.equal(id);
                expect(test._rev).to.equal(rev2);
            });
        });
        describe('dump', () => {
            it('writes json data to given path', () => {
                dataStore.put([
                    { _kind: 'test:1', test: true },
                ]);
                dataStore.dump('./test.json');
                expect(fs.existsSync('./test.json')).to.equal(true);
                fs.unlinkSync('./test.json');
            });
        });
        describe('load', () => {
            it('overwrites current database with contents of specified json file', () => {
                const [{ id: id1 }] = dataStore.put([
                    { _kind: 'test:1', test: true },
                ]);
                const [item1] = dataStore.get([ id1 ]);
                dataStore.dump('./test.json');
                const [{ id: id2 }] = dataStore.put([
                    { _kind: 'test:2', testing: true },
                ]);
                dataStore.load('./test.json');
                const res = dataStore.get([ id1, id2 ]);
                const [test1, test2] = res;
                expect(test1).to.be.an('object');
                expect(test1).to.deep.equal(item1);
                expect(test2).to.equal(undefined);
                fs.unlinkSync('./test.json');
            });
        });
    });
    // separate from the other tests so we can have a single before instead of beforeEach setup
    describe('query', () => {
        let dataStore;
        before(() => {
            dataStore = new DataStore()
            dataStore.put([
                { _kind: 'test:1', a: 1 },
                { _kind: 'test:1', a: 2 },
                { _kind: 'test:1', a: 3 },
                { _kind: 'test:2', a: 'test' },
                { _kind: 'test:2', a: 'really testing' },
                { _kind: 'test:3', a: 1, b: 1, test: true },
                { _kind: 'test:3', a: 2, b: 2, test: false },
                { _kind: 'test:3', a: 2, b: 3, test: false },
            ]);
        });
        it('from unknown kind returns empty array', () => {
            const res = dataStore.query('test:5');
            expect(res).to.be.an('array').with.lengthOf(0);
        });
        it('from kind returns all units of that kind', () => {
            const res = dataStore.query('test:1');
            expect(res).to.be.an('array').with.lengthOf(3);
        });
        it('does not return results outside of the given kind', () => {
            const res = dataStore.query('test:2');
            expect(res.every(r => r._kind === 'test:2'));
        });
        it('less than', () => {
            const res = dataStore.query('test:1', [{ prop: 'a', op: '<', val: 3 }]);
            expect(res).to.be.an('array').with.lengthOf(2);
        });
        it('less than equal', () => {
            const res = dataStore.query('test:1', [{ prop: 'a', op: '<=', val: 2 }]);
            expect(res).to.be.an('array').with.lengthOf(2);
        });
        it('equal', () => {
            const res = dataStore.query('test:2', [{ prop: 'a', op: '=', val: 'test' }]);
            expect(res).to.be.an('array').with.lengthOf(1);
        });
        it('greater than equal', () => {
            const res = dataStore.query('test:1', [{ prop: 'a', op: '>=', val: 2 }]);
            expect(res).to.be.an('array').with.lengthOf(2);
        });
        it('greater than', () => {
            const res = dataStore.query('test:1', [{ prop: 'a', op: '>', val: 2 }]);
            expect(res).to.be.an('array').with.lengthOf(1);
        });
        it('not equal', () => {
            const res = dataStore.query('test:2', [{ prop: 'a', op: '!=', val: 'test' }]);
            expect(res).to.be.an('array').with.lengthOf(1);
        });
        it('string starts with', () => {
            const res = dataStore.query('test:2', [{ prop: 'a', op: '%', val: 'really' }]);
            expect(res).to.be.an('array').with.lengthOf(1);
        });
        describe('multi-where', () => {
            it('a > 1 && test === true should be empty', () => {
                const res = dataStore.query(
                    'test:3',
                    [
                        { prop: 'a', op: '>', val: 2 },
                        { prop: 'test', op: '=', val: true },
                    ]
                );
                expect(res).to.be.an('array').with.lengthOf(0);
            });
            it('a < 2 && test === true should return 1', () => {
                const res = dataStore.query(
                    'test:3',
                    [
                        { prop: 'a', 'op': '<', val: 2 },
                        { prop: 'test', op: '=', val: true },
                    ]
                );
                expect(res).to.be.an('array').with.lengthOf(1);
            });
            it('a > 1 && b > 1 should return 2', () => {
                const res = dataStore.query(
                    'test:3',
                    [
                        { prop: 'a', 'op': '>', val: 1 },
                        { prop: 'b', 'op': '>', val: 1 },
                    ]
                );
                expect(res).to.be.an('array').with.lengthOf(2);
            });
        });
    });
});
