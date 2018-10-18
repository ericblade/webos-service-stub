const Service = require('..');
const service = new Service('com.webos.service.test');

const subscriptions = {};

let pingInterval;

service.register('/ping', (message) => {
    const { payload: { subscribe } } = message;
    if (subscribe) {
        subscriptions[message.uniqueToken] = message;
    }
    message.respond({ returnValue: true, message: 'pong!', subscribed: !!subscribe });
}, (cancelMessage) => {
    delete subscriptions[cancelMessage.uniqueToken];
});

setInterval(() => {
    for (let s in subscriptions) {
        subscriptions[s].respond({ message: 'subscription pong uniqueToken ' + s });
    }
}, 1000);

module.exports = service;
