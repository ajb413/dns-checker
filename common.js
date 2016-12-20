// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// Imports
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const main       = require('./main.js');
const ispApi     = require('./isp_api.js');
const sqlite     = require('sqlite3').verbose();
const pubnub     = require('pubnub');
const dns_module = require('native-dns');

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// PubNub
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
let pn = new pubnub({
	  "publishKey"   : main.pn_settings.pn_pub_key
	, "subscribeKey" : main.pn_settings.pn_sub_key
});

function pn_publish ( msg ) {
	pn.publish({
		  "channel" : main.pn_settings.pn_channel
		, "message" : msg
	});
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SQLite
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
function getDnsList () {
	return new Promise((resolve, reject) => {
		let db = new sqlite.Database(main.db_file);
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
		isp,
		last_pass,
		last_fail,
		pn_success_count,
		pn_check_count,
		pn_percent_resolve,
		google,
		baidu,
		wiki,
		pubnub
	) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
`;

function upsert ( rows ) {
	return new Promise(( resolve, reject ) => {
		let db = new sqlite.Database(main.db_file);
		db.serialize(function() {
			rows.forEach(function( dns, i ) {
				db.run(upsertQuery, [
					  dns['id']
					, dns['ip']
					, dns['name']
					, dns['isp']
					, dns['last_pass']
					, dns['last_fail']
					, dns['pn_success_count']
					, dns['pn_check_count']
					, dns['pn_percent_resolve']
					, dns['google']
					, dns['baidu']
					, dns['wiki']
					, dns['pubnub']
				], function ( err ) {
					if (err) reject();
				});
				if (i === rows.length-1) resolve();
			});
		});
	});
}

let unresolvedQuery = `
	SELECT
		id,
		ip,
		name,
		last_pass,
		last_fail,
		pn_percent_resolve
	FROM DNS
	WHERE pubnub=0
`;

function getUnresolved () {
	return new Promise(( resolve, reject ) => {
		let db = new sqlite.Database(main.db_file);
		db.serialize(function() {
			db.all(unresolvedQuery, function( err, rows ) {
				if (err) reject();
				resolve(rows);
			});
		});
	});
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// Executes dig main.dig_retries times before deciding it has failed
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
function digController ( dnsToTest, domainToTest ) {
	return new Promise(( resolve, reject ) => {
		forLoop(0, main.dig_retries);

		function forLoop ( iteration, length ) {
			dig(dnsToTest, domainToTest).then(function ( result ) {
				if (result) {
					resolve(true);
				}
				if (!result && iteration < length-1) {
					forLoop(iteration+1, length);
				}
				if (!result && iteration === length-1) {
					resolve(false);
				}
			});
		}
	});
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// dig - node js version of the unix command
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
function dig ( dnsToTest, domainToTest ) {
	return new Promise(( resolve, reject ) => {
		let req = dns_module.Request({
			"question" : dns_module.Question({
				"name" : domainToTest,
				"type" : 'A',
			}),
			server: { "address": dnsToTest, port: 53, type: 'udp' },
			timeout: main.dig_timeout,
		});

		req.on( 'timeout', function () {
			return resolve(false);
		});

		req.on( 'message', function ( err, answer ) {
			return resolve(err ? false : true);
		});

		req.send();
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
	, "concurrency_limit" : main.concurrency_limit
	, "test_domains"      : main.test_domains
	, "updateDnsRecord"   : main.updateDnsRecord
	, "csv"               : main.csv
	, "db_file"           : main.db_file
};
