let ServiceInterface;

try {
    ServiceInterface = require('webos-service');
    ServiceInterface.prototype.webOS = true;
    ServiceInterface.prototype.webOSSimulation = false;
} catch (err) {
    ServiceInterface = require('./lib/ServiceStub');
    ServiceInterface.prototype.webOS = false;
    ServiceInterface.prototype.webOSSimulation = true;
}

ServiceInterface.prototype.registerOriginal = ServiceInterface.prototype.register;
ServiceInterface.prototype.stubMethods = {};

// register: it's not 100% clear from the code what the intent of registering multiple times is --
// the webos-service module does not register the callback to the new location, but does call the
// internal bus registration again -- this doesn't make much sense as to what it's trying to achieve
ServiceInterface.prototype.register = function register(methodName, requestCallback, cancelCallback) {
    const EventEmitter = require('events');
    let emitter;
    if (!this.stubMethods[methodName]) {
        emitter = new EventEmitter();
        if (requestCallback) {
            emitter.on('request', requestCallback);
        }
        if (cancelCallback) {
            emitter.on('cancel', (message) => cancelCallback(message));
        }
        if (!this.stubMethods) {
            this.stubMethods = {};
        }
        this.stubMethods[methodName] = emitter;
    } else {
        emitter = this.stubMethods[methodName];
        if (requestCallback) {
            emitter.removeAllListeners('request');
            emitter.on('request', requestCallback);
        }
        if (cancelCallback) {
            emitter.removeAllListeners('cancel');
            emitter.on('cancel', (message) => cancelCallback(message));
        }
    }
    if (this.registerOriginal) {
        this.registerOriginal(methodName, requestCallback, cancelCallback);
    }
    return emitter;
};

ServiceInterface.prototype.callPromise = function callPromise(uri, args) {
    return new Promise(function handlePromiseCall(resolve, reject) {
        const { DEBUG_LUNA_CALLS: debug } = process.env;
        if (debug) {
            console.warn(`**>> call ${uri}`);
        }
        this.call(uri, args, (res) => {
            if (debug) {
                console.warn(`**<< ret ${uri} ${JSON.stringify(res.payload)}`);
            }
            if (res.payload.returnValue) {
                resolve(res.payload);
            } else {
                reject(res.payload);
            }
        })
    }.bind(this))
};

ServiceInterface.prototype.callMethod = function callMethod(method, inParams = {}) {
    return new Promise(function handleCall(resolve, reject) {
        const outParams = {
            payload: inParams,
            method,
            isSubscription: inParams.subscribe === true,
            category: '/', // TODO: should separate category from method, but does anyone care?
            uniqueToken: 'qwerty', // TODO: not sure if anyone uses this...
            token: 1, // TODO: also not sure if anyone uses this
            sender: this.busId || '', // normally the service name of the sender
            ls2Message: {}, // TODO: no idea what this looks like
            activityManager: this.activityManager,
            service: {}, // TODO: no idea what this looks like
            activity: {}, // TODO: no idea what this looks like
            respond: function handleResponse(response) {
                if (!response.returnValue) {
                    reject(response);
                } else {
                    resolve(response);
                }
            },
            cancel: function handleCancel() {
                this.stubMethods[method].emit('cancel');
                reject({ returnValue: false });
            },
        };
        if (!this.stubMethods[method]) {
            reject({
                returnValue: false,
                errorCode: -1,
                errorText: `Unknown method "${method}" for category "/"`, // TODO: separate method from category
            });
            return;
        }
        this.stubMethods[method].emit('request', outParams);
    }.bind(this));
};

ServiceInterface.prototype.subscribeMethod = function subscribeMethod(method, inParams = {}, onResponse, onCancel) {
    const { DEBUG_LUNA_CALLS: debug } = process.env;
    if (debug) {
        console.warn('* subscribeMethod', method);
    }
    const EventEmitter = require('events');
    const emitter = new EventEmitter();
    if (onResponse) {
        emitter.on('response', onResponse);
    }
    if (onCancel) {
        emitter.on('cancel', onCancel);
    }
    const outParams = {
        payload: inParams,
        method,
        isSubscription: inParams.subscribe === true,
        category: '/', // TODO: should separate category from method, but does anyone care?
        uniqueToken: 'qwerty', // TODO: not sure if anyone uses this...
        token: 1, // TODO: also not sure if anyone uses this
        sender: this.busId || '', // normally the service name of the sender
        ls2Message: {}, // TODO: no idea what this looks like
        activityManager: this.activityManager,
        service: {}, // TODO: no idea what this looks like
        activity: {}, // TODO: no idea what this looks like
        respond: function handleResponse(response) {
            if (debug) {
                console.warn('**** handleResponse', response);
            }
            emitter.emit('response', response);
        },
        cancel: function handleSubscriptionCancel() {
            emitter.emit('response', { subscribed: false, returnValue: true });
            this.stubMethods[method].emit('cancel', outParams);
        }.bind(this),
    };
    emitter.cancel = function cancelSubscription() {
        this.stubMethods[method].emit('cancel', outParams);
        emitter.emit('response', { subscribed: false, returnValue: true });
    }.bind(this);
    setImmediate(() => {
        if (!this.stubMethods[method]) {
            emitter.emit('cancel', {
                returnValue: false,
                errorCode: -1,
                errorText: `Unknown method "${method}" for category "/"`, // TODO: separate method from category
            });
            return;
        }
        this.stubMethods[method].emit('request', outParams);
    });
    return emitter;
}

if (!ServiceInterface.prototype.webOS) {
    const DatabaseStub = require('./lib/DatabaseStub');
}

module.exports = function (serviceName) {
    return new ServiceInterface(serviceName);
}
