const ServiceStub = require('../lib/lunasim/ServiceStub');
global.ServiceStub = ServiceStub;

const WebosService = require('../lib/lunasim/LunaService');
global.WebosService = WebosService;

const { expect, assert } = require('chai');
global.expect = expect;
global.assert = assert;

global.createService = (name = 'test-service') => new ServiceStub(name);
global.destroyService = (service) => service.unregisterService();

const testServiceInstance = new WebosService('test-interface');
global.callService = function callService(name, ...rest) {
    if (!name.startsWith('luna://') && !name.startsWith('palm://')) {
        name = `luna://${name}`;
    }
    return testServiceInstance.callPromise(name, ...rest);
}.bind(testServiceInstance);

global.subscribeService = function subscribeService(name, ...rest) {
    if (!name.startsWith('luna://') && !name.startsWith('palm://')) {
        name = `luna://${name}`;
    }
    return testServiceInstance.subscribe(name, ...rest);
}.bind(testServiceInstance);
