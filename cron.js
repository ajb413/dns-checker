var CronJob = require('cron').CronJob;
var app = require('./app.js');

let interval = "*/10 * * * *";
//let interval = "0-59 * * * *";
//let interval = "0,30 * * * *";

var job = new CronJob(interval, function() {
		try {
			app.run();
		}
		catch (error) {
			console.log(new Date() + ": " + error);
		}
	},
	null, /* This function is executed when the job stops */
	true, /* Start the job right now */
	'America/Los_Angeles' /* Time zone of this job. */
);