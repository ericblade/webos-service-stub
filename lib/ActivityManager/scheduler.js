// For a smart interval, the interval must be an even multiple of days,
// or one of the following: 12h, 6h, 3h, 1h, 30m, 15m, 10m, or 5m.

let service;

const intervalTimes = new Set()
    .add('1m')
    .add('5m')
    .add('10m')
    .add('15m')
    .add('30m')
    .add('1h')
    .add('3h')
    .add('6h')
    .add('12h')
    .add('2d')
;

if (process.env.NODE_ENV === 'testing') {
    intervalTimes.add('5s').add('10s').add('15s').add('30s');
}

const intervalCallbacks = new Map();

const run_intervals = (intervalName) => {
    console.warn('* run_intervals', intervalName);
    const callbacksToRun = intervalCallbacks.get(intervalName);
    if (!callbacksToRun) {
        return;
    }
    // TODO: insert requirements check here
    callbacksToRun.forEach(cb => service.call(cb.method, cb.params, (message) => {
        // console.warn('* cb.method returns', cb.method, message);
        // TODO: check cb.ignoreReturn here, and act as appropriate, either rescheduling, or abandoning
    }));
};

const getIntervalTime = (intervalName) => {
    const multiplierName = intervalName.substr(-1);
    let multiplier;
    switch(multiplierName) {
        case 's': multiplier = 1000; break;
        case 'm': multiplier = 1000 * 60; break;
        case 'h': multiplier = 1000 * 60 * 60; break;
        case 'd': multiplier = 1000 * 60 * 60 * 24; break;
        default: console.error('unknown multiplierName', multiplierName); break;
    }
    const num = parseInt(intervalName);
    return num * multiplier;
};

intervalTimes.forEach(intervalName => {
    intervalCallbacks.set(intervalName, new Set());
    setInterval(() => run_intervals(intervalName), getIntervalTime(intervalName));
});

// TODO: we shouldn't start the setIntervals above, we should start them here, so that nothing
// runs if there's no one waiting for it.  we should also make sure that we cancel the intervals
// if no one is left to run after completing an activity.
const scheduleActivity = (time, callback = {}) => {
    if (!intervalTimes.has(time)) {
        return new Error(`interval not implemented ${time}`);
    }
    if (!callback) {
        return new Error('no callback');
    }
    if (!callback.method) {
        return new Error('no callback method');
    }
    if (!callback.params) {
        return new Error('no callback params');
    }
    intervalCallbacks.get(time).add(callback);
};

module.exports = (serviceInstance) => {
    service = serviceInstance;
    return {
        scheduleActivity,
    };
};
