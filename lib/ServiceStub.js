const url = require('url');

const services = new Map();

function ServiceStub(serviceName) {
    this.self = this;
    services.set(serviceName, this);
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
    const { host } = parsed;
    const service = services.get(host);
    if (service) {
        setTimeout(() => {
            service.callMethod(parsed.path, args)
            .then(res => callback({ payload: res }))
            .catch(err => callback({ payload: err }));
        })
    } else {
        setTimeout(() => {
            callback({ payload: { returnValue: true } })
        }, 1);
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
