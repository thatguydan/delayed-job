var Scheduler = require('../index.js');

var scheduler = Scheduler.createScheduler({
  backend: {
    name: 'redis',
    jobHoldingBay: 'myUniqueListKey'
  }
});

scheduler.on('job',function(job) {
  console.log('Received job',job);
});

var myJob = {
  title: 'Great Gig In The Sky'
};

scheduler.delay(myJob,2000);