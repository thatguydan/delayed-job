delayed-job
===========

## Assumptions
* errors thrown will result in re-establishing the scheduler [expand]
* Single atomic source of truth
* Db interactions are also atomic
* Jobs emitted have no immediate relationship to one another