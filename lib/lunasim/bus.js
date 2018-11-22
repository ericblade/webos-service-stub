const url = require('url');
const services = new Map();
const globalStubMethods = new Map();

const registerService = (serviceName, serviceProvider) => {
    services.set(serviceName, serviceProvider);
    globalStubMethods.set(serviceName, new Set());
};

const unregisterService = (serviceName) => {
    services.remove(serviceProvider);
    globalStubMethods.remove(serviceName);
};

const call = (uri, args, callback) => {
    const parsed = url.parse(uri);
    const { host } = parsed;
    const service = services.get(host);
    if (service) {
        process.nextTick(() => {
            service.callMethod(parsed.path, args)
            .then(res => callback({ payload: res }))
            .catch(err => callback({ payload: err }));
        });
    } else {
        if (callback) {
            const payload = process.env.FAIL_UNKNOWN_LUNA_SERVICES ? {
                returnValue: false,
                errorCode: -1,
                errorText: `Service does not exist: ${host}.`,
            } : { returnValue: true };
            process.nextTick(() => {
                callback({ payload });
            });
        }
    }
};

module.exports = class {
    constructor() {
        process.nextTick(() => {
            const DatabaseStub = require('../DatabaseStub');
            this.db = new DatabaseStub('com.webos.service.db');
            this.tempdb = new DatabaseStub('com.webos.service.tempdb');
            this.settingsService = require('../SettingsService');
            this.activityManager = require('../ActivityManager');
        });
    }
}
