const url = require('url');
const EventEmitter = require('events');

const services = new Map();
const globalStubMethods = {};

function ServiceStub(serviceName, activityManager, options = {}) {
    // There is probably no good reason to support idleTimer here, without also implementing a way
    // to bring services up at will, also, and then why don't we just implement activitymanager...
    // it is mentioned here for completeness.
    const { noBuiltInMethods, idleTimer } = options;
    this.self = this;
    // TODO: throw an error if someone tries to register with a duplicate name, just like the real one does
    services.set(serviceName, this);
    // console.warn('**** new service called', serviceName);
    this.busId = serviceName;
    this.stubMethods = globalStubMethods;
    this.stubMethods[serviceName] = {};
    this.webOS = true;
    this.webOSSimulation = true;
    this.activityManager = activityManager || {
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
    if (noBuiltInMethods) {
        this.noBuiltInMethods = true;
    }
}

// this is NOT a function that exists in webos-service, you should not call this directly. You
// should use the luna-bus to call /quit.  This is here to allow /quit to simulate quitting. without
// exiting the node process and therefore any other services that might be running in it.
ServiceStub.prototype.unregisterService = function unregisterService() {
    // TODO: when a service goes down, anyone waiting for a response from it, or subscribed to it,
    // receives an error.  We should make sure that error is broadcast to all listeners/subscribers
    // right here at this location.
    services.delete(this.busId);
    delete globalStubMethods[this.busId];
    delete this.stubMethods[this.busId];
    delete this;
}

ServiceStub.prototype.call = function call(uri, args, callback) {
    // console.warn('**** call=', uri);
    if (!callback) {
        console.warn(`* service ${uri} called with no callback -- this will work, but is it what you want?`);
    }
    const parsed = url.parse(uri);
    if (process.env.DEBUG_LUNA_CALLS) {
        console.warn('* stub ls2 bus call', uri, args);
    }
    const { host } = parsed;
    const service = services.get(host);
    if (service) {
        setTimeout(() => {
            if (process.env.DEBUG_LUNA_CALLS) {
                console.warn('* service found', service);
            }
            service.callMethod(parsed.path, args)
            .then(res => callback({ payload: res }))
            .catch(err => callback({ payload: err }));
        }, 1);
    } else {
        if (process.env.DEBUG_LUNA_CALLS) {
            console.warn('* service not found');
        }
        if (callback) {
            const payload = process.env.FAIL_UNKNOWN_LUNA_SERVICES ? {
                returnValue: false,
                errorCode: -1,
                errorText: `Service does not exist: ${host}.`,
            } : { returnValue: true };
            setTimeout(() => {
                callback({ payload });
            }, 1);
        }
    }
};

ServiceStub.prototype.subscribe = function subscribe(uri, args) {
    if (!args.subscribe && !args.watch) {
        console.warn('* subscribe called without subscribe or watch parameter set to true!', uri);
    }
    if (process.env.DEBUG_LUNA_CALLS) {
        console.warn('* stub ls2 bus subscribe', uri, args);
    }
    const parsed = url.parse(uri);
    const { host } = parsed;
    const service = services.get(host);
    if (service) {
        if (process.env.DEBUG_LUNA_CALLS) {
            console.warn('* service found');
        }
        return service.subscribeMethod(parsed.path, args);
    } else {
        if (process.env.DEBUG_LUNA_CALLS) {
            console.warn('* service not found');
        }
        const payload = process.env.FAIL_UNKNOWN_LUNA_SERVICES ? {
            returnValue: false,
            errorCode: -1,
            errorText: `Service does not exist: ${host}.`,
            subscribed: false
        } : { returnValue: true, subscribed: true };
        const emitter = new EventEmitter();
        emitter.cancel = () => { emitter.emit('cancel'); };
        setTimeout(() => emitter.emit('response', { payload }), 1);
        return emitter;
    }
};

ServiceStub.prototype.registerBuiltInMethods = function() {
    this.register('/quit', this.quit);
    // TODO: info
    // this.register('/info', this.info);
}

module.exports = ServiceStub;
