const ServiceStub = require('../lib/ServiceStub');
global.ServiceStub = ServiceStub;

const WebosService = require('..');
global.WebosService = WebosService;

const { expect } = require('chai');
global.expect = expect;

global.createService = (name = 'test-service') => new ServiceStub(name);
global.destroyService = (service) => service.unregisterService();

const testServiceInstance = new WebosService('test-interface');
global.callService = function callService(name, ...rest) {
    if (!name.startsWith('luna://') && !name.startsWith('palm://')) {
        name = `luna://${name}`;
    }
    return testServiceInstance.callPromise(name, ...rest);
}.bind(testServiceInstance);
