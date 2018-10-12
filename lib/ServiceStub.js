const url = require('url');

function ServiceStub(serviceName) {
    this.self = this;
    this.busId = serviceName;
    this.stubMethods = {};
    this.webOS = true;
    this.webOSSimulation = true;
    this.activityManager = {
        create: (activityName, callback) => {
            console.warn('* stub activityManager create', activityName, callback);
            setImmediate(() => callback());
        },
        complete: (activitySpec, options, callback) => {
            console.warn('* stub activityManager complete', activitySpec, options, callback);
            setImmediate(() => callback());
        },
    };
}

ServiceStub.prototype.call = function call(uri, args, callback) {
    const parsed = url.parse(uri);
    if (process.env.DEBUG_LUNA_CALLS) {
        console.warn('* stub ls2 bus call', uri, args);
    }
    if (this.database && uri.startsWith('luna://com.webos.service.db')) {
        setTimeout(() => {
            this.database.callMethod(parsed.path, args)
                .then(res => callback({ payload: res }))
                .catch(err => callback({ payload: err }));
        }, 1);
    } else if (this.database && uri.startsWith('luna://com.webos.service.tempdb')) {
        setTimeout(() => {
            this.tempdatabase.callMethod(parsed.path, args)
                .then(res => callback({ payload: res }))
                .catch(err => callback({ payload: err }))
        }, 1);
    } else if (uri.startsWith(`luna://${this.busId}`) || uri.startsWith(`palm://${this.busId}`)) {
        setTimeout(() => {
            this.callMethod(parsed.path, args)
                .then(res => callback({ payload: res }))
                .catch(err => callback({ payload: err }));
        }, 1);
    } else {
        setTimeout(() => {
            callback({ payload: { returnValue: true } })
        }, 10);
    }
}

ServiceStub.prototype.subscribe = function subscribe(uri, args) {
    if (process.env.DEBUG_LUNA_CALLS) {
        console.warn('* stub ls2 bus subscribe', uri, args);
    }
    const EventEmitter = require('events');
    const emitter = new EventEmitter();
    emitter.cancel = () => { emitter.emit('cancel'); };
    setTimeout(() => emitter.emit('request', args), 100);
    return emitter;
}

module.exports = ServiceStub;
