const common = require('./common.js');
const async = require('async');

module.exports = {
	"start" : start
}

function start() {
	return new Promise(( resolve, reject ) => {
		common.getDnsList().then(function ( dnsList ) {
			main(dnsList).then(function ( doneList ) {
				resolve(doneList);
			});
		});
	});
}

function main ( dnsList ) {
	return new Promise(( resolve, reject ) => {
		let doneList = [];
		async.eachLimit(dnsList, common.concurrency_limit,
			function ( dns, callback ) {
				var digs = [];
				for (let domain of common.test_domains) {
					digs.push(common.dig( dns.ip, domain.name ));
				}
				Promise.all(digs).then( results => {
					//logic in main.js
					common.updateDnsRecord( dns, results ).then(function (updatedDns) {
						doneList.push(updatedDns);
						console.log(updatedDns);
						callback();
					});
				});
			}, function () {
				resolve(doneList);
		});
	});
}
