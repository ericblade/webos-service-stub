const deepEquals = require('fast-deep-equal');

const DataStore = require('./database/DataStore');

const METHODS_UNIMPL = new Set()
    .add('/delKind').add('/getProfile')
    .add('/profile').add('/putKind')
    .add('/putPermissions').add('/putQuotas').add('/quotaStats')
    .add('/removeAppData').add('/search').add('/stats')
;

const validBatchOperations = new Set()
    .add('put').add('get').add('del').add('find').add('merge');
class DatabaseStub {
    batch({ payload: { operations }, respond } = {}) {
        // TODO: no operations: {"errorCode":-986,"errorText":"required prop not found: 'operations'","returnValue":false}
        // TODO: operations not an Array: {"errorCode":22,"errorText":"invalid parameters: caller='com.webos.lunasend-12660' error='invalid type for property 'operations''","returnValue":false}
        if (operations.some(o => !validBatchOperations.has(o) || (o.method === 'find' && o.params.watch === true))) {
            respond({
                errorCode: -3982,
                errorText: 'db: invalid operation in batch',
                returnValue: false,
            });
            return;
        }
        if (operations.some(o => !o.method)) {
            respond({
                errorCode: -3984,
                errorText: 'No required key: "method"',
                returnValue: false,
            });
            return;
        }
        if (operations.some(o => !o.params)) {
            respond({
                errorCode: -3984,
                errorText: 'No required key: "params"',
                returnValue: false,
            });
            return;
        }
        const ret = Promise.all(operations.map(o => {
            this.service.callPromise(`luna://${this.service.busId}/${o.method}`, o.params);
        }))
        .then(() => respond({ operations: ret }));
    }

    compact({ respond } = {}) {
        this.dataStore.compact();
        respond({ returnValue: true });
    }

    // on a live db8, purge differs from compact, in that it also does a space check and removes
    // temporary data. We have no space check operation (what does that even do in db8?) or
    // temporary data to purge.  It also returns a count of the number of items purged, which
    // compact does not.
    purge({ respond } = {}) {
        const count1 = this.dataStore.getCount();
        this.dataStore.compact();
        respond({ count: count1 - this.dataStore.getCount(), returnValue: true });
    }

    purgeStatus({ respond } = {}) {
        respond({ rev: this.dataStore.purgeRev, returnValue: true });
    }

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

    find(message) {
        const {
            payload: {
                count,
                query,
                watch
            },
            isSubscription,
            respond,
        } = message;
        const { from, page, select } = query;

        if (!from && !page) {
            respond({
                errorCode: -986,
                errorText: 'required prop not found: from',
                returnValue: false,
            });
            return;
        }

        if(select !== undefined && !Array.isArray(select)) {
            respond({
                errorCode: 22,
                returnValue: false,
                errorText: "invalid parameters: caller='caller' error='invalid type for property 'select' for property 'query''", // TODO: dig out how to add correct caller name to this string
            });
            return;
        }

        const results = page ? this.dataStore.getPage(page) : this.dataStore.query(query);
        // TODO: find out what real db8 does if you give it a bad page number, as well as if
        // you specify page in addition to other queries parameters.
        // console.warn('**** Stub find results', { query, results, returnValue: true });
        const next = results.next;
        if (next) delete results.next;
        const resultCount = results.count;
        if (resultCount) delete results.count;
        const response = { results, returnValue: true };
        if (next) response.next = next;
        if (count && resultCount) response.count = resultCount;
        respond(response);
        if (watch && isSubscription) {
            this.watches.push({ query, message, prevResults: results });
        }
    }

    del({ payload: { ids = [], query, purge=true }, respond } = {}) {
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
            const queryRes = this.dataStore.query(query);
            idsToDel = queryRes.map(r => r._id); // eslint-disable-line no-underscore-dangle
        }
        const deleteFunction = (purge ? this.dataStore.delPurge : this.dataStore.del).bind(this.dataStore);
        const results = deleteFunction(idsToDel);
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
            const queryRes = this.dataStore.query(query);
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
            const queryRes = this.dataStore.query(query);
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

    // TODO: /search should also support watches.
    // the docs say watch will always return { returnValue: true, fired: true }, however, it
    // actually always returns { subscribe: false, returnValue: true, fired: true }. This may be
    // because "subscribed" === false is always expected at the end of a subscription, and web
    // apps and node services use subscription instead of the separate "watch" facility that ls2
    // exposes. I suspect "subscribed" is intended, not subscribe.
    // ALSO according to the docs, you will only receive a response when the watch fires -- this is
    // NOT true.  If you specify a query that returns a result now, you will receive { returnValue:
    // true, fired: true, subscribed: false }, and you will receive NO FURTHER DATA.  If you specify
    // a query that does NOT currently return a result, you will receive { returnValue: true }, then
    // when the database DOES have a match for that query, you'll receive { returnValue: true,
    // fired: true, subscribe: false }
    watch(message) {
        const { payload: { query }, respond } = message;
        if (query) {
            const queryRes = this.dataStore.query(query);
            if (queryRes.length) {
                respond({
                    returnValue: true,
                    fired: true,
                    subscribe: false,
                });
            } else {
                this.watches.push({ query, message });
                respond({
                    returnValue: true,
                });
            }
        } else {
            respond({
                errorCode: -986,
                returnValue: false,
                errorText: "required prop not found: 'query'",
            });
        }
    }

    checkWatches() {
        this.watches = this.watches.filter((watch) => {
            if (!watch) return false;
            const { query, message } = watch;
            const res = this.dataStore.query(query);
            if (res.length) {
                if (!watch.prevResults || !deepEquals(res, watch.prevResults)) {
                    message.respond({ returnValue: true, fired: true, subscribe: false });
                    if (message.isSubscription) {
                        message.cancel({});
                    }
                    return false;
                }
            }
            return true;
        });
    }

    constructor(serviceName, ServiceFactory) {
        this.service = new ServiceFactory(serviceName);
        this.dataStore = new DataStore();
        this.dataStore.on('del', this.checkWatches.bind(this));
        this.dataStore.on('put', this.checkWatches.bind(this));
        this.dataStore.on('merge', this.checkWatches.bind(this));
        this.dataStore.on('load', this.checkWatches.bind(this));
        this.dataStore.on('compact', this.checkWatches.bind(this));
        this.watches = [];
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
            '/watch': this.watch.bind(this),
        };
        Object.keys(methods).forEach(k => this.service.register(k, methods[k]));
        return this.service;
    }
}

module.exports = DatabaseStub;
