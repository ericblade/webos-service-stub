const Service = require('../ServiceStub');
const service = new Service('com.webos.service.activitymanager');
const scheduler = require('./scheduler')(service);

let activityCounter = 1;

const createActivity = (message) => {
    const { activity, start, replace, subscribe } = message.payload;
    // TODO: it is not really a goal to fully simulate activitymanager here, but to provide enough
    // to handle when it is used.
    message.respond({ activityId: activityCounter++, returnValue: true, subscribed: !!subscribe });
}

// const x = scheduler.scheduleActivity('1m', {
//     method: 'luna://com.webos.service.db/get',
//     params: {
//         query: {
//             from: 'test:1',
//         },
//     },
// });

// console.warn('* x=', x);
module.exports = service.register('/create', createActivity);
