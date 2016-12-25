// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// node js version of the unix dig command using npm native-dns
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const dns_module = require('native-dns');

module.exports = { dig : function ( dnsToTest, domainToTest, settings ) {
		return new Promise(( resolve, reject ) => {
			let req = dns_module.Request({
				"question" : dns_module.Question({
					"name" : domainToTest,
					"type" : settings.type,
				}),
				server: {
					"address" : dnsToTest,
					"port"    : settings.port,
					"type"    : settings.protocol
				},
				timeout: timeoutLength,
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
};
