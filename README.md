# webos-service-stub

This is a module to be used for building and testing webOS node.js service components both on and
off device.

## Requirements

node.js v6.11.0+

## Optional

A webOS device running node.js v6.11.0+

## Usage

To use this module, require it instead of the on-device webos-service module.
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
without having to deploy the code to a device specifically to test.

The database simulation is NOT 100%. Notably, it does not understand the vagaries of webOS indices,
and therefore, if your indices are not setup properly on device, you'll get failures on device where
you get successes off device. It also has no concept of schema, or any other kind metadata.

The database simulation does not support the following methods:

batch, compact, delKind, dump, getProfile, load, profile, purge, purgeStatus, putKind,
putPermissions, putQuotas, quotaStats, removeAppData, search, stats, watch

Supported database simulation methods:

- reserveIds: appears to be complete, according to the documentation
- get: appears to be complete, according to the documentation
- find: mostly complete for general use. does not support limit, orderBy, incDel, select. find
  queries with "where" do not support "%%" operation (partial text match)
- del: mostly complete for general use. does not support purge: false
- put: mostly complete. as stub does not understand kinds, it will accept any information you throw
  at it, even if you do not match your on-device kind's schemas.
- merge: supports basic operation with objects array, and queries
- mergePut: supports basic operation with queries -- live database does not seem to support mergePut with objects.

## Adding more services to the simulation

The simulation has now been extended to support multiple services -- any code that instantiates a new Service object with this library will be pulled into the simulation, and any functions that it registers should be callable from any other service, just as a live luna-bus service would be.

To add new services to this library, write a service, and require it in the index.js here, in the block at the bottom.

# Enjoy!
