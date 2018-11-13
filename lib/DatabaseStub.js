const deepEquals = require('fast-deep-equal');

const Service = require('./ServiceStub');
const DataStore = require('./database/DataStore');

const METHODS_UNIMPL = new Set()
    .add('/batch').add('/compact').add('/delKind').add('/getProfile')
    .add('/profile').add('/purge').add('/purgeStatus').add('/putKind')
    .add('/putPermissions').add('/putQuotas').add('/quotaStats')
    .add('/removeAppData').add('/search').add('/stats')
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
        const { from, where, limit, page } = query;

        if (!from && !page) {
            respond({
                errorCode: -986,
                errorText: 'required prop not found: from',
                returnValue: false,
            });
            return;
        }
        const results = page ? this.dataStore.getPage(page) : this.dataStore.query({ from, where, limit });
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
            const queryRes = this.dataStore.query(query);
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

    constructor(serviceName) {
        this.service = new Service(serviceName);
        this.dataStore = new DataStore();
        this.dataStore.on('del', this.checkWatches.bind(this));
        this.dataStore.on('put', this.checkWatches.bind(this));
        this.dataStore.on('merge', this.checkWatches.bind(this));
        this.dataStore.on('load', this.checkWatches.bind(this));
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
