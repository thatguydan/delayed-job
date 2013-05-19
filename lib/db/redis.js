var redis = require('redis-url');
var async = require('async');

exports.createDB = function(opts) {
  return new DB(opts.url || null);
};

function DB(opts) {

  // TODO figure out opts
  this._conn = redis.connect(opts);

  opts = opts || {};

  this._holdingListKey = opts.jobHoldingBay || 'holdingListKey';
  this._semaphorName = ['delayed',Math.round(Math.random()*100)].join(':');
}

DB.prototype.lock = function(fn) {
  this.locked = true;
  this._conn.set(this._semaphorName,'1',function(err){
    if (err) throw err;
    this.locked = false;
    fn(null);
  });
};

DB.prototype.unlock = function(fn) {
  this._conn.del(this._semaphorName,function(err){
    if (err) throw err;
    this.locked = true;
    fn(null);
  });
};

/**
 * Fetch all jobs to be executed between now and an end date
 * @param  {Number}   until Timestamp, end date to fetch jobs
 * @param  {Function} fn    Callback
 */
DB.prototype.fetchJobs = function(until,fn) {

  this._conn.zrange(this._holdingListKey,0,-1,'WITHSCORES',function(err,results) {

    // Results being an array of couplets
    // 'job' => interval

    var matchingJobs = [];
    var endExecutionTime = (new Date().getTime()) + until;

    for (var i=0; i<results.length;i=i+2) {

      var jobId = results[i];
      var jobExecutionDate = parseInt(results[++i]);

      if (isNaN(jobExecutionDate)) {
        return fn(new Error('fetchJobs - jobExecutionDate is not a number'));
      }

      if (jobExecutionDate <= endExecutionTime) {
        matchingJobs.push(jobId);
      }
    }

    // By now `matchingJobs` is an array of stringified objects
    // that fall within our execution window.
    if (matchingJobs.length === 0)
      fn(null,matchingJobs);
    else {
      // Editors note: I had this in a fn with a try/catch
      // But couldn't decide the best course of action if the
      // JSON.parse threw, so I'm bubbling it up for now.
      // Perhaps we should nuke offending string that aren't
      // parsable?
      this._conn.zrem(this._holdingListKey,matchingJobs,function(err) {
        // TODO fail more gracefully?
        if (err) throw err;
        else fn(null,matchingJobs.map(JSON.parse));
      });
    }
  }.bind(this));
};

DB.prototype.insertJob = function(job,timeout,cb) {

  var jobExecutionDate = (new Date()).getTime() + timeout;
  this._conn.zadd(this._holdingListKey,jobExecutionDate,JSON.stringify(job),cb);
};