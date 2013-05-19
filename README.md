delayed-job
===========
delayed-job is a horizontally scalable implementation of Ruby's delayed_job. Using semaphore locks it aims to provide an atomic interface to a federation of workers operating on the same job queue. Initial work has focussed on a Redis backed database, however more backend implementations are possible.

# Installation

```
npm install delayed-job
```

# Usage
```
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
```

# API

## schedular.delay(job,timeout)
Schedule a job for execution

# Assumptions
* errors thrown will result in re-establishing the scheduler [expand]
* Single atomic source of truth
* Db interactions are also atomic
* Jobs emitted have no immediate relationship to one another