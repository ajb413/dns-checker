const main   = require('./main.js');
const common = require('./common.js');
const db     = require('./create_db.js');
const async  = require('async');
const fs     = require('fs');

const db_exists = fs.existsSync(common.db_file);

module.exports = {
	"run" : run
};

function run() {
	async.waterfall([
		  createDb
		, appStart
		, upsert
		, getUnresolved
		//, getIsps
		, pn_publish
	]);
}

function createDb ( callback ) {
	if ( !db_exists ) {
		db.createDb().then(function () {
			callback();
		});
	}
	else {
		callback();
	}
}

function appStart ( callback ) {
	main.start().then(function ( doneList ) {
		callback(null, doneList);
	});
}

function upsert ( doneList, callback ) {
	common.upsert(doneList)
	.then(function () {
		callback();
	});
}

function getUnresolved ( callback ) {
	common.getUnresolved()
	.then(function ( unresolved ) {
		callback(null, unresolved);
	});
}

function getIsps( unresolved, callback ) {
	common.getIsps(unresolved)
	.then(function ( unresolvedWithIsp ) {
		callback(null, unresolvedWithIsp);
	});
}

function pn_publish ( unresolvedWithIsp, callback ) {
	for (let dns of unresolvedWithIsp ) {
		common.pn_publish({
			  "id"         : dns['id']
			, "ip"         : dns['ip']
			, "name"       : dns['name']
			, "country_id" : dns['country_id']
			//, "isp"        : dns['isp']
			, "last_pass"  : dns['last_pass']
			, "last_fail"  : dns['last_fail']
			, "pn_percent" : dns['pn_percent_resolve']
			, "pndsn"      : dns['pndsn']
			, "pnnet"      : dns['pnnet']
		});
	}
}
