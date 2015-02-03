/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var flatMap = require('./flatMap').flatMap;
var Sink = require('../sink/Pipe');

exports.map = map;
exports.ap  = ap;
exports.constant = constant;
exports.tap = tap;

/**
 * Transform each value in the stream by applying f to each
 * @param {function(*):*} f mapping function
 * @param {Stream} stream stream to map
 * @returns {Stream} stream containing items transformed by f
 */
function map(f, stream) {
	return new Stream(new Map(f, stream.source));
}

/**
 * Assume fs is a stream containing functions, and apply each function to each value
 * in the xs stream.  This generates, in effect, a cross product.
 * @param {Stream} fs stream of functions to apply to the xs
 * @param {Stream} xs stream of values to which to apply all the fs
 * @returns {Stream} stream containing the cross product of items
 */
function ap(fs, xs) {
	return flatMap(function(f) {
		return map(f, xs);
	}, fs);
}

/**
 * Replace each value in the stream with x
 * @param {*} x
 * @param {Stream} stream
 * @returns {Stream} stream containing items replaced with x
 */
function constant(x, stream) {
	return map(function() {
		return x;
	}, stream);
}

/**
 * Perform a side effect for each item in the stream
 * @param {function(x:*):*} f side effect to execute for each item. The
 *  return value will be discarded.
 * @param {Stream} stream stream to tap
 * @returns {Stream} new stream containing the same items as this stream
 */
function tap(fEv, fErr, fEnd, stream) {
	return new Stream(new Tap(fEv, fErr, fEnd, stream.source));
}

function Tap(fEv, fErr, fEnd, source) {
	this.fEv = fEv;
	this.fErr = fErr;
	this.fEnd = fEnd;
	this.source = source;
}

Tap.prototype.run = function(sink, scheduler) {
	return this.source.run(new TapSink(this.fEv, this.fErr, this.fEnd, sink), scheduler);
};

function TapSink(fEv, fErr, fEnd, sink) {
	this.fEv = fEv;
	this.fErr = fErr;
	this.fEnd = fEnd;
	this.sink = sink;
}

TapSink.prototype.event = function(t, x) {
	this.fEv(x);
	this.sink.event(t, x);
};

TapSink.prototype.error = function(t, x) {
	var fErr = this.fErr;

	fErr && fErr(x);
	this.sink.error(t, x);
};

TapSink.prototype.end = function(t, x) {
	var fEnd = this.fEnd;

	fEnd && fEnd(x);
	this.sink.end(t, x);
};

function Map(f, source) {
	this.f = f;
	this.source = source;
}

Map.prototype.run = function(sink, scheduler) {
	return this.source.run(new MapSink(this.f, sink), scheduler);
};

function MapSink(f, sink) {
	this.f = f;
	this.sink = sink;
}

MapSink.prototype.end   = Sink.prototype.end;
MapSink.prototype.error = Sink.prototype.error;

MapSink.prototype.event = function(t, x) {
	var f = this.f;
	this.sink.event(t, f(x));
};
