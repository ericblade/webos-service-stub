const service = require('./index');

service.callMethod('/ping', {})
.then(res => console.warn('**** callMethod ping response', res))
.then(() => service.callPromise('luna://com.webos.service.test/ping', {}))
.then(res => console.warn('**** callPromise ping response', res))
.then(() => {
    console.warn('* subscribe test');
    const emitter = service.subscribeMethod('/ping', { subscribe: true });
    emitter.on('request', (res) => {
        console.warn('**** subscription returned', res);
    });
    emitter.on('cancel', (res) => {
        console.warn('**** subscription cancelled', res);
    });
})
.then(() => service.callPromise('luna://com.webos.service.db/put', { objects: [{ _kind: 'db-test-kind:1', test: true, ping: 'pong' }]}))
.then(res => console.warn('* db put res', res))
.then(() => service.callPromise('luna://com.webos.service.db/find', { query: { from: 'db-test-kind:1' }}))
.then(res => console.warn('* db get res', res))
.catch(err => console.warn('*** something responded with an error!', err));

setTimeout(() => process.exit(), 5000);
