var Converter = require("csvtojson").Converter;
var fs = require("fs"); 

//CSV File Path or CSV String or Readable Stream Object
var csvFileName = "./nameservers.csv";
var jsonFileName = "./nameservers.json";

//new converter instance
var csvConverter = new Converter({});

//array of DNSses
var dnsArray = [];

//end_parsed will be emitted once parsing finished
csvConverter.on("end_parsed",function(addresses){
	var count = 0;
	addresses.forEach(function (address) {
		count++;

		dnsArray.push({
			"ip"   : address.ip,
			"name" : address.name
		});
		
		if (count === addresses.length) {
			var ips = JSON.stringify( { "dns" : dnsArray } );
			fs.writeFile(jsonFileName, ips, function(err) {
				if (err) console.log(err);
			}); 
		}
	});
});

//read from file
fs.createReadStream(csvFileName).pipe(csvConverter);