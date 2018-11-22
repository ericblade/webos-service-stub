let ServiceFactory = require('./lunasim/LunaService.js');
let BusFactory = require('./lunasim/bus');

let bus;

function InvokeServiceFactory(serviceName, activityManager, options = {}) {
    if (!bus) {
        bus = new BusFactory();
    }
    return new ServiceFactory(serviceName, activityManager, options);
}

module.exports = InvokeServiceFactory;
module.exports.setServiceFactory = (factory) => ServiceFactory = factory;
module.exports.setBusFactory = (factory) => BusFactory = factory;
module.exports.DatabaseStub = require('./DatabaseStub');
