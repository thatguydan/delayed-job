var Scheduler = require('../index.js');

var scheduler = Scheduler.createScheduler();

scheduler.on('job',function(job) {
  console.log('Received job',job);
});

var myJob = {
  title: 'Great Gig In The Sky'
};

scheduler.delay(myJob,2000);