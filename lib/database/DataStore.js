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
    // TODO: write test for compact()
    compact() {
        this.dataStore = this.dataStore.filter(x => x._del !== true);
        this.emitter.emit('compact');
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
    get(ids, incDel=false) {
        // console.warn('**** get', ids);
        return this.dataStore.filter((d) => {
            return ids.includes(d._id) && (!d._del || incDel === true);
        });
    }
    del(ids) {
        const results = [];
        ids.forEach(id => {
            const row = this.dataStore.find(data => data._id === id);
            if (row) {
                row._del = true;
                results.push({ id: row._id, rev: this.revCounter++ });
            }
        });
        return results;
    }
    delPurge(ids) {
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
    // TODO: query: implement incDel (requires supporting purge: false in del)
    // TODO: what if you specify a non-numerical limit? what if you specify a non-bool count?

    query({ from, where, limit=500, orderBy, desc, select, incDel=false } = {}) {
        if (limit > 500) {
            limit = 500;
        }

        const resultFilter = (d) => {
            if (d._kind !== from) {
                return false;
            }
            if (d._del === true && !incDel) {
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
        };

        const selectMap = (d) => {
            const ret = {};
            select.forEach(s => {
                if (d[s] !== undefined) {
                    ret[s] = d[s];
                }
            });
            return ret;
        }

        const results = this.dataStore.reduce((accumulator, next) => {
            if (resultFilter(next)) {
                if(select) {
                    accumulator.push(selectMap(next));
                } else {
                    accumulator.push(next);
                }
            }
            return accumulator;
        }, []);

        if (orderBy) {
            results.sort((a, b) => {
                const ao = a[orderBy];
                const bo = b[orderBy];
                if (ao < bo) {
                    return desc ? 1 : -1;
                }
                if (ao > bo) {
                    return desc ? -1 : 1;
                }
                return 0;
            });
        }

        let ret;
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
            ret = page0;
        }

        if (limit === 0) ret = [];
        else if (!ret) ret = results;
        ret.count = results.length;
        return ret;
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
        return this.pageMap.get(pageId);
    }
}

module.exports = DataStore;
