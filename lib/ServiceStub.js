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
            const emitter = this.subscribe('luna://com.webos.service.activitymanager/create', {
                activity: {
                    name: `${activityName}1`,
                    description: `activity created for ${activityName}1`,
                    type: {
                        foreground: true,
                        persist: false,
                        explicit: true,
                    },
                },
                start: true,
                replace: true,
                subscribe: true,
            });
            if (callback) {
                callback(emitter);
            }
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
        if (process.env.DEBUG_LUNA_CALLS) {
            console.warn('* service found');
        }
        setTimeout(() => {
            service.callMethod(parsed.path, args)
            .then(res => callback({ payload: res }))
            .catch(err => callback({ payload: err }));
        })
    } else {
        if (process.env.DEBUG_LUNA_CALLS) {
            console.warn('* service not found');
        }
        const payload = process.env.FAIL_UNKNOWN_LUNA_SERVICES ? {
            returnValue: false,
            errorCode: -1,
            errorText: `Service does not exist: ${host}.`,
        } : { returnValue: true };
        setTimeout(() => {
            callback({ payload })
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
