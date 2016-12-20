const app    = require('./app.js');
const common = require('./common.js');
const db     = require('./create_db.js');
const async  = require('async');
const fs     = require('fs');

const db_exists = fs.existsSync(common.db_file);

async.waterfall([
	createDb,
	appStart,
	upsert,
	getUnresolved,
	getIsps,
	pn_publish
]);

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
	app.start().then(function ( doneList ) {
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
	//dont get isps for now
	callback(null, unresolved);

	// common.getIsps(unresolved)
	// .then(function ( unresolvedWithIsp ) {
	// 	callback(null, unresolvedWithIsp);
	// });
}

function pn_publish ( unresolvedWithIsp, callback ) {
	for ( dns in unresolvedWithIsp ) {
		common.pn_publish({
			  "id"         : dns['id']
			, "ip"         : dns['ip']
			, "name"       : dns['name']
			//, "isp"        : dns['isp']
			, "last_pass"  : dns['last_pass']
			, "last_fail"  : dns['last_fail']
			, "pn_percent" : dns['pn_percent_resolve']
		});
	}
}