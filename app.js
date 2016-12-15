let dns = require("native-dns");
let dnsList  = require("./nameservers.json")["dns"];

//testing domains
let google = "google.com";
let baidu  = "baidu.com";
let wiki   = "wikipedia.com";
let pubnub = "pubsub.pubnub.com";

for ( let [i, dns] of dnsList.entries() ) {
	let googleDig = dig(dns.ip, google);
	let baiduDig  = dig(dns.ip, baidu);
	let wikiDig   = dig(dns.ip, wiki);
	let pubnubDig = dig(dns.ip, pubnub);

	Promise.all([googleDig, baiduDig, wikiDig, pubnubDig]).then(digs => {
		let res = {
			"name_server" : dns.ip,
			"domain"	  : dns.name,
			"date"		  : new Date(),
			"google" 	  : digs[0],
			"baidu" 	  : digs[1],
			"wikipedia"   : digs[2],
			"pubnub" 	  : digs[3]
		};

		if ((res.google || res.baidu || res.wikipedia) && !res.pubnub)
		{
			console.log(JSON.stringify(res.domain));
		}
	});
}

function dig ( dnsToTest, domainToTest ) {
	return new Promise((resolve, reject) => {
		let req = dns.Request({
			"question"	: dns.Question({
				"name"	: domainToTest,
				"type"	: 'A',
			}),
			server: { "address": dnsToTest, port: 53, type: 'udp' },
			timeout: 15000,
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