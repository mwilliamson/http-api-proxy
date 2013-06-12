exports.createQueue = createQueue;

function createQueue(rateLimit) {
    var queue = []
    var gap = rateLimit.gap;
    var timeOfNextRequest = 0;
    var waiting = false;
    
    function next() {
        if (queue.length === 0) {
            waiting = false;
            return;
        }
        
        var now = getNow();
        if (now >= timeOfNextRequest) {
            timeOfNextRequest = now + gap;
            queue.shift()();
        }
        setTimeout(next, timeOfNextRequest - now);
        waiting = true;
    }
    
    function add(func) {
        queue.push(func);
        if (!waiting) {
            next();
        }
    }
    
    return {
        add: add
    }
}

function getNow() {
    return new Date().getTime();
}

