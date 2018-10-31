const Service = require('./ServiceStub');
const DataStore = require('./database/DataStore');

const METHODS_UNIMPL = new Set()
    .add('/batch').add('/compact').add('/delKind').add('/getProfile')
    .add('/profile').add('/purge').add('/purgeStatus').add('/putKind')
    .add('/putPermissions').add('/putQuotas').add('/quotaStats')
    .add('/removeAppData').add('/search').add('/stats').add('/watch')
;

class DatabaseStub {
    reserveIds({ payload: { count = 1 }, respond } = {}) {
        if (count) {
            const ids = this.dataStore.reserveIds(count);
            respond({ ids, returnValue: true });
        }
    }

    get({ payload: { ids }, respond } = {}) {
        const results = this.dataStore.get(ids);
        respond({ results, returnValue: true });
    }

    find({ payload: { query }, respond } = {}) {
        const { from, where } = query;
        if (!from) {
            respond({
                errorCode: -986,
                errorText: 'required prop not found: from',
                returnValue: false,
            });
            return;
        }
        const results = this.dataStore.query(from, where);
        // console.warn('**** Stub find results', { query, results, returnValue: true });
        respond({ results, returnValue: true });
    }

    del({ payload: { ids = [], query }, respond } = {}) {
        if (!ids && !query) { // a real database currently hangs if no params given, see https://github.com/webosose/db8/issues/3
            // TODO: when the above bug is fixed, return the same error that a live db would.
            respond({
                errorCode: -986,
                errorText: 'required prop not found: ids or query',
                returnValue: false,
            });
            return;
        }
        let idsToDel = ids;
        if (query) {
            const { from, where } = query;
            const queryRes = this.dataStore.query(from, where);
            idsToDel = queryRes.map(r => r._id); // eslint-disable-line no-underscore-dangle
        }
        const results = this.dataStore.del(idsToDel);
        const numDeleted = results.length;
        if (query) {
            respond({ count: numDeleted, returnValue: true });
        } else {
            respond({ results, returnValue: true });
        }
    }

    put({ payload: { objects }, respond } = {}) {
        const results = this.dataStore.put(objects);
        if (results.errorCode) {
            respond(results);
            return;
        }
        respond({ results, returnValue: true });
    }

    merge({ payload: { objects, query, props }, respond } = {}) {
        if (!objects && !query && !props) {
            respond({
                errorCode: 22,
                errorText: 'db: either objects or query param required for merge',
                returnValue: false,
            });
            return;
        }
        const mergeObjects = (obj) => {
            const results = this.dataStore.merge(obj);
            if (results.errorCode) {
                respond(results);
                return;
            }
            respond({ results, returnValue: true });
        };
        if (objects) {
            mergeObjects(objects);
            return;
        }
        if (!query) {
            respond({
                errorCode: 22,
                errorText: "invalid parameters: required prop not found - 'query' for property 'props''", // yes, two '' at the end just like the real database
                returnValue: false,
            });
            return;
        }
        if (!props) {
            respond({
                errorCode: -986,
                errorText: "required prop not found: 'props'",
                returnValue: false,
            });
            return;
        }
        if (query) {
            const { from, where } = query;
            const queryRes = this.dataStore.query(from, where);
            const obj = queryRes.map(x => Object.assign(x, props));
            mergeObjects(obj);
            return;
        }
        respond({
            errorCode: -1,
            errorText: 'hit end of merge function, dont know what to do',
            returnValue: false,
        });
    }

    mergePut({ payload: { objects, query, props }, respond } = {}) {
        // objects does NOT work on live database as far as I can tell
        if (query) {
            const { from, where } = query;
            const queryRes = this.dataStore.query(from, where);
            const obj = queryRes.map(x => Object.assign(x, props));
            if (obj.length) {
                this.merge({ payload: { objects: obj }, respond });
                return;
            }
            this.put({ payload: { objects: [props] }, respond });
        }
        // TODO: add some error messages for bad usage
    }

    dump({ payload: { path }, respond } = {}) {
        // TODO: look up what a live db8 does if you have no path
        // TODO: handle file write errors, and error according to spec
        if (path) {
            this.dataStore.dump(path);
            respond({
                count: this.dataStore.getCount(),
                returnValue: true,
            });
        }
    }

    load({ payload: { path }, respond } = {}) {
        // TODO: look up what a live db8 does if you have no path
        // TODO: handle file read / deserialize errors, and error according to spec
        if (path) {
            this.dataStore.load(path);
            respond({
                count: this.dataStore.getCount(),
                returnValue: true,
            });
        }
    }

    constructor(serviceName) {
        this.service = new Service(serviceName);
        this.dataStore = new DataStore();
        METHODS_UNIMPL.forEach(name => this.service.register(
            name,
            ({ respond }) => respond({
                returnValue: false,
                message: `${name} not implemented`,
            })
        ));

        const methods = {
            '/reserveIds': this.reserveIds.bind(this),
            '/get': this.get.bind(this),
            '/find': this.find.bind(this),
            '/del': this.del.bind(this),
            '/put': this.put.bind(this),
            '/merge': this.merge.bind(this),
            '/mergePut': this.mergePut.bind(this),
            '/dump': this.dump.bind(this),
            '/load': this.load.bind(this),
        };
        Object.keys(methods).forEach(k => this.service.register(k, methods[k]));
        return this.service;
    }
}

module.exports = DatabaseStub;
