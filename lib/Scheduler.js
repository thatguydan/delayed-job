var path = require('path');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var util = require('util');

util.inherits(Scheduler, EventEmitter);
module.exports = Scheduler;

/**
 * Scheduler
 * @param {Object} opts Object containing configuration
 * @param {Object} opts.backend Object containing backend connection options
 * @param {Number} opts._pollInterval Number of second with which we will
 *                                    poll the database
 */
function Scheduler(opts) {
  EventEmitter.call(this);

  opts = opts || {};

  // Check whether a backend was provided
  if (opts.backend) {
    var db = path.resolve('./db',opts.backend.name+'.js');
    this._backend = db.createDB(opts.backend);
  }
  else {
    this._backend = require('./db/redis.js').createDB();
  }

  // Check whether a poll interval was provided.
  this._pollInterval = opts.pollInterval || 1000;

  // On instantiation assume we are locked
  this.locked = true;

  clearInterval(this._iv);
  this._iv = setInterval(loop.bind(this),this._pollInterval);
};

/**
 * Delay a job by a certain timeout
 * @param  {Object} job     Payload to delay
 * @param  {Number} timeout Seconds to delay this job by
 * @param  {Function} cb    Callback
 */
Scheduler.prototype.delay = function(job,timeout,cb) {
  this._backend.insertJob(job,timeout,cb);
};

function loop() {

  var self = this;

  var until = this._pollInterval;

  async.series({
    'lock': function(cb) { self._backend.lock(cb) },
    'jobs': function(cb) { self._backend.fetchJobs(until, cb) },
    'unlock': function(cb) { self._backend.unlock(cb) }
  },function(err,results){

    // results.lock and & results.unlock should
    // not return any data. Any errors should be
    // thrown and caught bu this:
    if (err) throw err;

    // If not, emit a 'job' event for every job found
    results.jobs.forEach(function(job){

      this.emit('job',job);
    }.bind(this));

  }.bind(this))
};