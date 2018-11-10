# webos-service-stub

This is a module to be used for building and testing webOS node.js service components both on and
off device.

You could also use this as a basic system to handle communication between micro-services, or as an
add-on test layer for microservices.  You could create a test setup that requires several micro-
services into a single process, then creates Service objects to each of them, and tests their
capabilities that way.

## Requirements

node.js v6.11.0+

## Optional

A webOS device running node.js v6.11.0+

## Usage

### Directly as a webos-service replacement
The primary way to use this module, is to require it instead of the on-device webos-service module.
````
const Service = require('webos-service-stub');
const service = new Service('com.webos.service.myservicename');
````

This provides one method intended for use in general service development:

service.callPromise(uriForServiceCall, paramsObject)

returns a Promise that will resolve with the results of a service call if the result contains
returnValue: true, or will reject with the results of the service call if the result contains
returnValue: false.  If you are running this on device, it will use the actual service bus to
make the call and resolve the information.

example:
````
service.callPromise('luna://com.webos.service.db/find', { query: { from: 'com.webos.test:1' } })
.then(({ results }) => console.warn('database results', results));
````

### Via dependency injection

A second way of using this module, is to design your service in such a way that you can inject
a webos-service compatible Service object into it at runtime.  If you structure your service in such
a way that it does not immediately instantiate the webos-service module, then you can provide a
pointer to this module instead.  If your main module exports a class constructor, that takes a
parameter, such as:

````
class MyService {
    constructor(WebosServiceModule) {
        const Service = WebosServiceModule || require('webos-service');
        this.service = new Service('my.service.name');
    }
}
module.exports = MyServiceConstructor;
````

### Use as a communications bus for micro-services

For a micro-service (inside a single process!) communication method, you could require
('webos-service-stub') in each of your service modules, create a new instance, such as
````
microservice1.js
const Service = require('webos-service-stub');
const service = new Service('microservice1');
service.register('/hello', () => console.log('Hello world!'));
````
````
microservice2.js
const Service = require('webos-service-stub');
const service = new Service('microservice2');
service.register('/goodbye', () => console.log('Goodbye!'));
````
````
microservice3.js
const Service = require('webos-service-stub');
const service = new Service('microservice2');
service.callPromise('luna://microservice1/hello', {}).then(() => { do stuff }).then(() => service.callPromise('luna://microservice2/goodbye', {}));
````

### Use as a test layer for micro-services

If you don't want to bring webos-service-stub directly into your project, you can create a test
layer that requires all of your microservices into it, and uses the service bus to test various
services:
````
const microservice1 = require('./microservice1');
const microservice2 = require('./microservice2');
const Service = require('webos-service-stub');
const servicebus1 = new Service('microservice1');
const servicebus2 = new Service('microservice2');
const testbus = new Service('test-bus');
servicebus1.register('/start', () => microservice1.start());
servicebus2.register('/start', () => microservice2.start());
testbus.callPromise('luna://microservice1/start', {}).then(res => expect(res).to.deep.equal({ started: true })).then(() => testbus.callPromise('luna://microservice2/start', {}).then(res => expect(res).to.deep.equal({ started: true })));

````

## Methods intended for use in testing

This provides two methods intended for use IN TESTING ONLY, to test services both on and off device,
and these functions will NOT make calls using the actual service bus -- they only make calls inside
the actually running service.

service.callMethod(methodName, paramsObject)

````
service.callMethod('/myTestMethod', { })
.then(res => expect(res).to.deep.equal({ returnValue: true }));
````

This does the same thing as callPromise except it WILL NOT use the actual service bus to get there.
Any service methods that are not created by this specific service code will be inaccessible.

service.subscribeMethod(methodName, paramsObject)

Returns an Emitter that will emit a 'response' or a 'cancel' message when the given methodName
sends data to subscribers.

````
return new Promise((resolve, reject) => {
    service.subscribeMethod('/myTestMethod', { subscribe: true });
    service.on('response', res => {
        expect(res).to.deep.equal({ returnValue: true, subscribed: true });
        resolve();
    });
    service.on('cancel', res => reject(err));
});
````

Tip: If you install mocha/chai modules into your service, and copy it all to your webOS device,
you should be able to run your tests directly on device.  Lacking 'npm' and 'npx' on device, I have
used the following code inside a service-bus registered function to trigger tests to run on device:

````
const path = require('path');
const testFilePath = './test';

module.exports = (message) => {
    const { payload } = message;

    const Mocha = require('mocha');

    const mocha = new Mocha();
    mocha.addFile('./test/mocha.opts.js');
    // searchFsPath is a custom function to recursively search for all files in a given directory
    const testFiles = require('searchFsPath')(testFilePath).filter(file => file.endsWith('.js'));
    const runLast = [];
    testFiles.forEach((file) => mocha.addFile(file));
    mocha.run((failures) => {
        console.warn('* test failures=', failures);
        process.exitCode = failures ? -1 : 0;
        message.respond({ returnValue: failures === 0, failures });
    });
};
````

You can see a very, very simple test service and implementation of a small amount of tests, without
any test framework dependencies, in the 'test-service' directory in the repository.

## DatabaseStub

This stub also includes a basic simulation of the webOS database service, com.webos.service.db
and it's friend com.webos.service.tempdb.

These simulations do NOT store any data permanently.  They are meant for rapid testing, and unit
testing for service functions that make use of the on-device database functions of webOS devices,
without having to deploy the code to a device specifically to test.  If you were using this for
some purpose other than unit/integration testing webos services, you could implement a rudimentary
database persistence operation by simply calling /load at startup, and /dump at exit, or other
opportune times.

The database simulation is NOT 100%. Notably, it does not understand the vagaries of webOS indices,
and therefore, if your indices are not setup properly on device, you'll get failures on device where
you get successes off device. It also has no concept of schema, or any other kind metadata.

The database simulation does not support the following methods:

batch, compact, delKind, getProfile, profile, purge, purgeStatus, putKind,
putPermissions, putQuotas, quotaStats, removeAppData, search, stats

Supported database simulation methods:

- reserveIds: appears to be complete, according to the documentation
- get: appears to be complete, according to the documentation
- find: mostly complete for general use. does not support limit, orderBy, incDel, select. find
  queries with "where" do not support "%%" operation (partial text match)
- del: mostly complete for general use. does not support purge: false
- put: mostly complete. as stub does not understand kinds, it will accept any information you throw
  at it, even if you do not match your on-device kind's schemas.
- merge: supports basic operation with objects array, and queries
- mergePut: supports basic operation with queries -- live database does not seem to support mergePut
  with objects.
- dump: simply dumps the json content of the object database to the given disk file. Do NOT attempt
  to load the results of this to a live db8.
- load: simply reads the json content of the object database from the given disk file, replacing any
  other records in the database.
- watch: this includes watches in find. these should work as a live db8 does, which varies in
  several places from the db8 documentation.  Please see the DatabaseStub code for details, if
  you're not particularly familiar with db8 already. :-)

## ActivityManager

An extremely simple webOS ActivityManager stub is included. It currently only supports the /create
method, but does not perform any actions, other than returning results that would appear correct to
a webOS service that calls com.webos.service.activitymanager/create . More functionality of the
service could certainly be implemented, but has not yet proven to be necessary.

## SettingsService

An extremely simple implementation of the webOS on TV's settings service, com.webos.settingsservice,
is implemented.  It currently returns a static set of results that mirror what the responses are on
my consumer LG webOS TV.  This is intended to allow for testing of services that run on LG TV's, and
depend on the results of com.webos.settingsservice/getSystemSettings existing beyond a simple
{ returnValue: true } return.  This is not intended for any other use.

## Adding more services to the simulation

The simulation has now been extended to support multiple services -- any code that instantiates a new Service object with this library will be pulled into the simulation, and any functions that it registers should be callable from any other service, just as a live luna-bus service would be.

To add new services to this library, write a service, and require it in the index.js here, in the block at the bottom.

# Enjoy!
