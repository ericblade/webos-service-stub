const Service = require('./ServiceStub');
const DataStore = require('./database/DataStore');

const METHODS_UNIMPL = [
    '/batch', '/compact', '/delKind', '/dump', '/getProfile',
    '/load', '/mergePut', '/profile', '/purge', '/purgeStatus', '/putKind',
    '/putPermissions', '/putQuotas', '/quotaStats', '/removeAppData', '/search',
    '/stats', '/watch',
];

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
            idsToDel = queryRes.map(r => r._id);
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
        const mergeObjects = (objects) => {
            const results = this.dataStore.merge(objects);
            if (results.errorCode) {
                respond(results);
                return;
            }
            respond({ results, returnValue: true });
            return;
        }
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
        // console.warn('**** database merge not supported in stub via query', query);
        if (query) {
            const { from, where } = query;
            const queryRes = this.dataStore.query(from, where);
            const objects = queryRes.map(x => Object.assign(x, props));
            mergeObjects(objects);
            return;
        }
        respond({
            errorCode: -1,
            errorText: 'query not supported in stub merge',
            returnValue: false
        });
    }
    constructor(serviceName) {
        this.service = new Service(serviceName);
        this.dataStore = new DataStore();
        METHODS_UNIMPL.forEach(m => this.service.register(m, () => (console.log('* db stub hit', m), ({ returnValue: false, message: `${m} NOT IMPLEMENTED` }))));

        const methods = {
            '/reserveIds': this.reserveIds.bind(this),
            '/get': this.get.bind(this),
            '/find': this.find.bind(this),
            '/del': this.del.bind(this),
            '/put': this.put.bind(this),
            '/merge': this.merge.bind(this),
        };
        Object.keys(methods).forEach(k => this.service.register(k, methods[k]));
        return this.service;
    }
}

module.exports = DatabaseStub;
