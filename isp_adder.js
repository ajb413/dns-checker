const async = require("async");
const http = require("http");
const fs = require("fs");
const dnsList = require("./nameservers.json")["dns"];
var jsonFileName = "./nameservers.json";

async.eachSeries(dnsList, function (dns, callback) {
	http.get({
		host: "ip-api.com",
		path: "/json/" + dns.ip
	}, (res) => {
		var body = "";

		res.on("data", function(chunk) {
			body += chunk;
		});

		res.on("end", function() {
			body = JSON.parse(body);
			dns.isp = body.isp;
			setTimeout(function () {
				callback();
			}, 500);
		});
	});
}, function () {
	var ips = JSON.stringify( { "dns" : dnsList } );
	fs.writeFile(jsonFileName, ips, function(err) {
		if (err) console.log(err);
	}); 
});