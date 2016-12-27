const common    = require('./common.js');
const fs        = require('fs');
const sqlite    = require('sqlite3').verbose();
const Converter = require('csvtojson').Converter;

const csv  = common.csv;
const file = common.db_file;

module.exports = {
	"createDb" : createDb
}

function createDb () {
	return new Promise(( resolve, reject ) => {
		let db = new sqlite.Database(file);
		db.serialize(function() {
			//create the table in the db
			db.run(`
				CREATE TABLE DNS
				(
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					ip VARCHAR(255),
					name VARCHAR(255),
					country_id VARCHAR(255),
					isp VARCHAR(255),
					check_count INTEGER,
					last_pass VARCHAR(255),
					last_fail VARCHAR(255),
					google INTEGER,
					pubnub INTEGER,
					pndsn INTEGER,
					pnnet INTEGER,
					pn_success_count INTEGER,
					pn_percent_resolve FLOAT,
					dsn_success_count INTEGER,
					dsn_percent_resolve FLOAT,
					net_success_count INTEGER,
					net_percent_resolve FLOAT
				);
			`);

			var csvConverter = new Converter({});

			//end_parsed will be emitted once parsing finished
			csvConverter.on("end_parsed",function( dnss ){
				dnss.forEach(function ( dns, i ) {
					db.run(`INSERT OR IGNORE INTO DNS (
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
					) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
					[
						dns.ip,
						dns.name,
						dns.country_id,
						"",
						0,
						"",
						"",
						-1,
						-1,
						-1,
						-1,
						0,
						0.0,
						0,
						0.0,
						0,
						0.0,
					]);
					if ( i === dnss.length-1 ) resolve();
				});
			});

			//read from file
			fs.createReadStream(csv).pipe(csvConverter);
		});
	});
}