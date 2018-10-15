const Service = require('./ServiceStub');
const service = new Service('com.webos.service.activitymanager');

const activityCounter = 1;

const createActivity = (message) => {
    const { activity, start, replace, subscribe } = message.payload;
    // TODO: it is not really a goal to fully simulate activitymanager here, but to provide enough
    // to handle when it is used.
    message.respond({ activityId: activityCounter++, returnValue: true, subscribed: !!subscribe });
}

module.exports = service.register('/create', createActivity);
