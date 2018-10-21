/* eslint-disable no-console,global-require,import/no-unresolved,max-len,no-unused-vars,func-names */
const uniqueFilename = require('unique-filename');
const EventEmitter = require('events');

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

ServiceInterface.prototype.stubMethods = {};
ServiceInterface.prototype.registerOriginal = ServiceInterface.prototype.register;

// register: it's not 100% clear from the code what the intent of registering multiple times is --
// the webos-service module does not register the callback to the new location, but does call the
// internal bus registration again -- this doesn't make much sense as to what it's trying to achieve
// ... does it just make a second emitter that can handle the requests? i don't think that works,
// either
ServiceInterface.prototype.register = function register(methodName, requestCallback, cancelCallback) {
    // console.warn('* register this=');
    const useMethodName = methodName.startsWith('/') ? methodName : `/${methodName}`;
    let emitter;
    if (!this.stubMethods[this.busId]) {
        this.stubMethods[this.busId] = {};
        if(!this.noBuiltInMethods() && !this.registerOriginal) {
            this.registerBuiltInMethods();
        }
    }
    if (!this.stubMethods[this.busId][useMethodName]) {
        emitter = new EventEmitter();
        if (requestCallback) {
            emitter.on('request', requestCallback);
        }
        if (cancelCallback) {
            emitter.on('cancel', message => cancelCallback(message));
        }
        if (!this.stubMethods) {
            this.stubMethods = {};
            this.stubMethods[this.busId] = {};
        }
        this.stubMethods[this.busId][useMethodName] = emitter;
    } else {
        emitter = this.stubMethods[this.busId][useMethodName];
        if (requestCallback) {
            emitter.removeAllListeners('request');
            emitter.on('request', requestCallback);
        }
        if (cancelCallback) {
            emitter.removeAllListeners('cancel');
            emitter.on('cancel', message => cancelCallback(message));
        }
    }
    if (this.registerOriginal) {
        this.registerOriginal(useMethodName, requestCallback, cancelCallback);
    }
    return emitter;
};

ServiceInterface.prototype.originalQuit = ServiceInterface.prototype.quit;
ServiceInterface.prototype.quit = function doQuit(message) {
    if (this.unregisterService) {
        if (!this.originalQuit && message) {
            message.respond({ status: 'quitting' });
        }
        this.unregisterService(message);
    }
    // original quit function must be called from the luna bus, but we are allowing it to be called
    // directly for testing simulation. It would error if you called it directly in webos-service,
    // because it depends on a message.
    if (this.originalQuit)
        this.originalQuit(message);
};

/* eslint-disable prefer-arrow-callback */
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
        });
    }.bind(this));
};

ServiceInterface.prototype.callMethod = function callMethod(method, inParams = {}) {
    // console.warn('* callMethod', method, this.busId, this);
    return new Promise(function handleCall(resolve, reject) {
        const outParams = {
            payload: inParams,
            method,
            isSubscription: inParams.subscribe === true,
            category: '/', // TODO: should separate category from method, but does anyone care?
            uniqueToken: uniqueFilename(''),
            token: 1, // TODO: also not sure if anyone uses this
            sender: this.busId || '', // normally the service name of the sender
            ls2Message: {}, // TODO: no idea what this looks like
            activityManager: this.activityManager,
            service: {}, // TODO: no idea what this looks like
            activity: {}, // TODO: no idea what this looks like
            respond: function handleResponse(response) {
                if (!response) {
                    console.warn('**** service', this.busId, method, 'called respond with no parameters');
                }
                if (!response.returnValue) {
                    reject(response);
                } else {
                    resolve(response);
                }
            },
            cancel: function handleCancel() {
                if (!response) {
                    console.warn('**** service', this.busId, method, 'called cancel with no parameters');
                }
                this.stubMethods[this.busId][method].emit('cancel');
                reject({ returnValue: false });
            },
        };
        if (!this.stubMethods[this.busId][method]) {
            reject({
                returnValue: false,
                errorCode: -1,
                errorText: `Unknown method "${method}" for category "/"`, // TODO: separate method from category
            });
            return;
        }
        this.stubMethods[this.busId][method].emit('request', outParams);
    }.bind(this));
};

ServiceInterface.prototype.subscribeMethod = function subscribeMethod(method, inParams = {}, onResponse, onCancel) {
    const { DEBUG_LUNA_CALLS: debug } = process.env;
    if (debug) {
        console.warn('* subscribeMethod', this.busId, method);
    }
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
        uniqueToken: uniqueFilename(''),
        token: 1, // TODO: also not sure if anyone uses this
        sender: this.busId || '', // normally the service name of the sender
        ls2Message: {}, // TODO: no idea what this looks like
        activityManager: this.activityManager,
        service: {}, // TODO: no idea what this looks like
        activity: {}, // TODO: no idea what this looks like
        respond: function handleResponse(response) {
            if (!response) {
                console.warn('**** service', this.busId, method, 'called respond with no parameters');
            }
            if (debug) {
                console.warn('**** subscription handleResponse', this.busId, method, response);
            }
            // console.warn('**** emitting response to', emitter, response);
            if (response.subscribed === false) {
                this.stubMethods[this.busId][method].emit('cancel', outParams);
                emitter.emit('cancel', { payload: response });
            } else {
                emitter.emit('response', { payload: response });
            }
        }.bind(this),
        cancel: function handleSubscriptionCancel(response) {
            if (!response) {
                console.warn('**** service', this.busId, method, 'called cancel with no parameters');
            }
            this.stubMethods[this.busId][method].emit('cancel', outParams);
            emitter.emit('cancel', { payload: response });
        }.bind(this),
    };
    emitter.cancel = function cancelSubscription() {
        // console.warn('* cancelSubscription');
        this.stubMethods[this.busId][method].emit('cancel', outParams);
        process.nextTick(() => {
            emitter.removeAllListeners('response');
            emitter.removeAllListeners('cancel');
            delete emitter;
        });
    }.bind(this);
    if (!this.stubMethods[this.busId][method]) {
        setTimeout(() => {
            if (debug) {
                console.warn('* unknown method', this.busId, method);
            }
            emitter.emit('cancel', {
                returnValue: false,
                errorCode: -1,
                errorText: `Unknown method "${method}" for category "/"`, // TODO: separate method from category
            });
        }, 1);
        return emitter;
    }
    setTimeout(() => {
        this.stubMethods[this.busId][method].emit('request', outParams);
    }, 1);
    return emitter;
};

let db;
let tempdb;
let settingsService;
let activityManager;

/* eslint-disable global-require */
if (!ServiceInterface.prototype.webOS) {
    const DatabaseStub = require('./lib/DatabaseStub');
    db = new DatabaseStub('com.webos.service.db');
    tempdb = new DatabaseStub('com.webos.service.tempdb');
    settingsService = require('./lib/SettingsService');
    activityManager = require('./lib/ActivityManager');
}

module.exports = function (serviceName) {
    return new ServiceInterface(serviceName);
};
