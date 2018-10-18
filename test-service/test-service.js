const service = require('./index');

service.callMethod('/ping', {})
.then(res => console.warn('**** callMethod ping response', res))
.then(() => service.callPromise('luna://com.webos.service.test/ping', {}))
.then(res => console.warn('**** callPromise ping response', res))
.then(() => {
    return new Promise((resolve, reject) => {
        console.warn('* subscribe test');
        const emitter = service.subscribeMethod('/ping', { subscribe: true });
        const emitter2 = service.subscribeMethod('/ping', { subscribe: true });
        let counter1 = 0;
        let counter2 = 0;
        emitter.on('response', (res) => {
            console.warn('**** subscription returned', res, counter1);
            counter1++;
            if (res.message && counter1 > 2 && counter2 > 2) {
                emitter.cancel();
                emitter2.cancel();
                resolve();
            }
        });
        emitter.on('cancel', (res) => {
            console.warn('**** subscription cancelled', res);
        });
        emitter2.on('response', (res) => {
            console.warn('**** subscription2 returned', res, counter2);
            counter2++;
            if (res.message && counter1 > 2 && counter2 > 2) {
                emitter.cancel();
                emitter2.cancel();
                resolve();
            }
        });
        emitter2.on('cancel', (res) => {
            console.warn('**** subscription2 cancelled', res);
        })
    });
})
.then(() => service.callPromise('luna://com.webos.service.db/put', { objects: [{ _kind: 'db-test-kind:1', test: true, ping: 'pong' }]}))
.then(res => console.warn('* db put res', res))
.then(() => service.callPromise('luna://com.webos.service.db/find', { query: { from: 'db-test-kind:1' }}))
.then(res => console.warn('* db get res', res))
.catch(err => console.warn('*** something responded with an error!', err));

setTimeout(() => process.exit(), 5000);
