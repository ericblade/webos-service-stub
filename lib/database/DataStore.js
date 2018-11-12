// TODO: we should be able to implement watches, by storing a list of currently running watches,
// then every time we put, merge, or del:
// a- test the list of things to put, merge, or del, against the queries and if there's a match, notify watchers
// or b- run the query before the operation, run the operation, run the query again, and if they differ, then notify watchers.

const fs = require('fs');
const uniqueFilename = require('unique-filename');
const EventEmitter = require('events');

class DataStore {
    constructor() {
        this.dataStore = [];
        this.pageMap = new Map();
        this.revCounter = 0;
        this.emitter = new EventEmitter();
        this.on = this.emitter.on.bind(this.emitter);
    }
    load(file) {
        const buf = fs.readFileSync(file);
        let json;
        try {
            json = JSON.parse(buf);
        } catch (err) {
            console.warn('* error loading database file', err);
        }
        if (json) {
            this.dataStore = json;
            this.emitter.emit('load');
        }
    }
    dump(file) {
        fs.writeFileSync(file, JSON.stringify(this.dataStore));
        this.emitter.emit('dump');
    }
    getCount() {
        return this.dataStore.length;
    }
    reserveIds(count) {
        const ids = [...new Array(count)].map(() => uniqueFilename(''));
        return ids;
    }
    get(ids) {
        // console.warn('**** get', ids);
        return this.dataStore.filter(d => ids.includes(d._id));
    }
    del(ids) { // TODO: support purge: false
        const results = [];
        this.dataStore = this.dataStore.filter((d) => {
            const included = ids.includes(d._id);
            if (included) { // TODO: shouldn't do side effects in a filter, should be a reduce
                results.push({ id: d._id, rev: this.revCounter++ });
            }
            return !included;
        });
        this.emitter.emit('del');
        return results;
    }
    // TODO: notes for implementing "select" -- if you "select" with something that's not an array,
    // you receive:
    /*
    {
        "errorCode": 22,
        "returnValue": false,
        "errorText": "invalid parameters: caller='(busId of caller)' error='invalid type for property 'select' for property 'query''"
    }
    */
   // TODO: what if you specify a non-numerical limit? what if you specify a non-bool count?

    query(from, where, limit=500, count) {
        // TODO: count is in initial version. We should probably just have it always pass the resultCount, as it's easy to get to here,
        // and then have the 'find' function determine if the user cares about it existing or not.  That would simplify both sides of the
        // code, I think.  Yay, first implementation blues. :-D
        // console.warn('**** query', from, where);
        if (limit > 500) {
            limit = 500;
        }
        const results = this.dataStore.filter((d) => {
            if (d._kind !== from) {
                return false;
            }
            if (!where || !where.length) {
                return true;
            }
            return where.every((clause) => {
                switch (clause.op) {
                    case '<':
                        return d[clause.prop] < clause.val;
                    case '<=':
                        return d[clause.prop] <= clause.val;
                    case '=':
                        return d[clause.prop] === clause.val;
                    case '>=':
                        return d[clause.prop] >= clause.val;
                    case '>':
                        return d[clause.prop] > clause.val;
                    case '!=':
                        return d[clause.prop] !== clause.val;
                    case '%':
                        // TODO: should do actual 'is this a string' checking
                        return d[clause.prop].startsWith(clause.val);
                    default:
                        message.respond({ errorCode: -1, errorText: `unimplemented database stub operator ${clause.op}` });
                        return false;
                }
            });
        });
        if (results.length > limit && limit > 0) {
            const numPages = Math.ceil(results.length / limit);
            let page0;
            let currentPageId = uniqueFilename('');
            // TODO: this array chunking should probably be done with slice, per https://stackoverflow.com/questions/8495687/split-array-into-chunks
            for(let x = 0; x < numPages; x++) {
                const page = [];
                for(let y = 0; y < limit; y++) {
                    page.push(results[(x * limit) + y]);
                }
                if (x < numPages - 1) {
                    page.next = uniqueFilename('');
                }
                this.pageMap.set(currentPageId, page);
                currentPageId = page.next;
                if (x === 0) {
                    page0 = page;
                }
            }
            if (count) page0.count = results.length;
            return page0;
        }
        if (limit === 0) {
            const ret = [];
            if (count) ret.count = results.length;
            return ret;
        }
        if (count) results.count = results.length;
        return results;
    }
    put(objects) {
        // console.warn('**** put', objects);
        if (objects.some(o => !o._kind)) {
            return {
                errorCode: -3969,
                errorText: 'db: kind not specified',
                returnValue: false,
            };
        }
        const results = [];
        objects.forEach((o) => {
            if (!o._id) {
                o._id = uniqueFilename('');
            }
            o._rev = this.revCounter++;
            this.dataStore = this.dataStore.concat(o);
            results.push({ id: o._id, rev: o._rev });
        });
        this.emitter.emit('put');
        return results;
    }
    merge(objects) {
        if (objects.some(o => !o._id)) {
            return {
                errorCode: -3969,
                errorText: 'db: kind not specified (nor is _id!)',
                returnValue: false,
            };
        }
        if (objects.some(o => !this.dataStore.some(d => d._id === o._id))) {
            return {
                errorCode: -3969,
                errorText: 'db: kind not specified (an _id was given that doesnt match anything)',
                returnValue: false,
            };
        }
        const results = [];
        objects.forEach((o) => {
            const x = this.dataStore.findIndex(i => i._id === o._id);
            if (x !== -1) {
                const newObj = Object.assign({}, this.dataStore[x], o, { _rev: this.revCounter++ });
                this.dataStore[x] = newObj;
                results.push({ id: newObj._id, rev: newObj._rev });
            }
        });
        this.emitter.emit('merge');
        return results;
    }
    getPage(pageId) {
        console.warn('* pageMap=', this.pageMap);
        return this.pageMap.get(pageId);
    }
}

module.exports = DataStore;
