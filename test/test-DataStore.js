const DataStore = require('../lib/database/DataStore');

describe('Database DataStore', () => {
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
    // TODO: write query tests. there will be many.
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
    // TODO: tests for merge (there are a few error conditions to test)
});
