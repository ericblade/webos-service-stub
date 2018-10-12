const uniqueFilename = require('unique-filename');

class DataStore {
    constructor() {
        this.dataStore = [];
        this.revCounter = 0;
    }
    getCount() {
        return this.dataStore.length;
    }
    reserveIds(count) {
        const ids = [...new Array(count)].map(() => uniqueFilename(''));
        return ids;
    }
    get(ids) {
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
        return results;
    }
    query(from, where) {
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
        return results;
    }
    put(objects) {
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
        if (objects.some(o => !this.dataStore.some(d => d._id === x._id))) {
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
        return results;
    }
}

module.exports = DataStore;
