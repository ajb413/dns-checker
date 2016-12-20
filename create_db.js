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
					isp VARCHAR(255),
					last_pass VARCHAR(255),
					last_fail VARCHAR(255),
					pn_success_count INTEGER,
					pn_check_count INTEGER,
					pn_percent_resolve FLOAT,
					google INTEGER,
					baidu INTEGER,
					wiki INTEGER,
					pubnub INTEGER
				);
			`);

			var csvConverter = new Converter({});

			//end_parsed will be emitted once parsing finished
			csvConverter.on("end_parsed",function( dnss ){
				dnss.forEach(function ( dns, i ) {
					db.run(`INSERT OR IGNORE INTO DNS (
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
					) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
					[
						dns.ip,
						dns.name,
						"",
						"",
						"",
						0,
						0,
						0.0,
						-1,
						-1,
						-1,
						-1
					]);
					if ( i === dnss.length-1 ) resolve();
				});
			});

			//read from file
			fs.createReadStream(csv).pipe(csvConverter);
		});
	});
}