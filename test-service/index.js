const Service = require('..');
const service = new Service('com.webos.service.test');

const subscriptions = [];

let pingInterval;

service.register('/ping', (message) => {
    const { payload: { subscribe } } = message;
    if (subscribe) {
        subscriptions.push(message);
    }
    message.respond({ returnValue: true, message: 'pong!', subscribed: !!subscribe });
});

setInterval(() => subscriptions.forEach(s => s.respond({ message: 'subscription pong' })), 1000);

module.exports = service;
