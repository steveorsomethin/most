/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var PropagateTask = require('../scheduler/PropagateTask');

exports.range = range;

function range(start, count) {
    return new Stream(new RangeSource(start, count));
}

function RangeSource(start, count) {
    this.start = start;
    this.count = count;
}

RangeSource.prototype.run = function(sink, scheduler) {
    return new RangeProducer(this.start, this.count, sink, scheduler);
};

function RangeProducer(start, count, sink, scheduler) {
    this.scheduler = scheduler;
    this.task = new PropagateTask(runProducer, {start: start, count: count}, sink);
    scheduler.asap(this.task);
}

RangeProducer.prototype.dispose = function() {
    return this.task.dispose();
};

function runProducer(t, rangeInfo, sink) {
    var start = rangeInfo.start,
        count = rangeInfo.count;

    for(var i=start, l=count; i<l && this.active; ++i) {
        sink.event(0, i);
    }

    this.active && sink.end(0);
}
