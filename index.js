var Scheduler = require('./lib/Scheduler.js')

exports.createScheduler = function(opts) {
  return new Scheduler(opts);
}
