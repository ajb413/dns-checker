// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// Imports
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const settings = require('./settings.js');
const ispApi   = require('./isp_api.js');
const sqlite   = require('sqlite3').verbose();
const pubnub   = require('pubnub');
const dig      = require('./datagram.js')['dig'];

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// PubNub
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
let pn = new pubnub({
	  "publishKey"   : settings.pn_settings.pn_pub_key
	, "subscribeKey" : settings.pn_settings.pn_sub_key
	, "secretKey"    : settings.pn_settings.secret_key
});

function pn_publish ( msg ) {
	pn.publish({
		  "channel" : settings.pn_settings.pn_channel
		, "message" : msg
	});
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SQLite
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
function getDnsList () {
	return new Promise(( resolve, reject ) => {
		let db = new sqlite.Database(settings.db_file);
		db.serialize(function() {
			var sql = "SELECT * FROM DNS";

			db.all(sql, function( err, rows ) {
				if (err) reject();
				resolve(rows);
			});
		});
	});
}

let upsertQuery = `
	INSERT OR REPLACE INTO DNS (
		id,
		ip,
		name,
		country_id,
		isp,
		check_count,
		last_pass,
		last_fail,
		google,
		pubnub,
		pndsn,
		pnnet,
		pn_success_count,
		pn_percent_resolve,
		dsn_success_count,
		dsn_percent_resolve,
		net_success_count,
		net_percent_resolve
	) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`;

function upsert ( rows ) {
	return new Promise(( resolve, reject ) => {
		let db = new sqlite.Database(settings.db_file);
		db.serialize(function() {
			rows.forEach(function( dns, i ) {
				db.run(upsertQuery, [
					  dns['id']
					, dns['ip']
					, dns['name']
					, dns['country_id']
					, dns['isp']
					, dns['check_count']
					, dns['last_pass']
					, dns['last_fail']
					, dns['google']
					, dns['pubnub']
					, dns['pndsn']
					, dns['pnnet']
					, dns['pn_success_count']
					, dns['pn_percent_resolve']
					, dns['dsn_success_count']
					, dns['dsn_percent_resolve']
					, dns['net_success_count']
					, dns['net_percent_resolve']
				], function ( err ) {
					if (err) reject();
				});
				if ( i === rows.length-1 ) resolve();
			});
		});
	});
}

let unresolvedQuery = `
	SELECT
		id,
		ip,
		name,
		country_id,
		last_pass,
		last_fail,
		pn_percent_resolve
	FROM DNS
	WHERE google=1 and pubnub=0
`;

function getUnresolved () {
	return new Promise(( resolve, reject ) => {
		let db = new sqlite.Database(settings.db_file);
		db.serialize(function() {
			db.all(unresolvedQuery, function( err, rows ) {
				if (err) reject();
				resolve(rows);
			});
		});
	});
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// Executes dig settings.dig_retries times before deciding it has failed
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
function digController ( dnsToTest, domainToTest, digSettings ) {
	return new Promise(( resolve, reject ) => {
		seriesLoop(0, digSettings.retries);

		function seriesLoop ( iteration, length ) {
			dig(dnsToTest, domainToTest, digSettings)
			.then(function ( result ) {
				if (result) {
					resolve(true);
				}
				if (!result && iteration+1 < length) {
					seriesLoop(iteration+1, length);
				}
				else {
					resolve(false);
				}
			});
		}
	});
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// Exports
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
module.exports = {
	  "upsert"            : upsert
	, "getDnsList"        : getDnsList
	, "getUnresolved"     : getUnresolved
	, "pn_publish"        : pn_publish
	, "dig"               : digController
	, "getIsps"			  : ispApi.get
	, "dig_settings"      : settings.dig_settings
	, "concurrency_limit" : settings.concurrency_limit
	, "test_domains"      : settings.test_domains
	, "updateDnsRecord"   : settings.updateDnsRecord
	, "csv"               : settings.csv
	, "db_file"           : settings.db_file
};
