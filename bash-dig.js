// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// dig using bash - only works on unix based machines
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const exec = require('child_process').exec;

module.exports = { dig : function (dns, domain, timeoutLength) {
		return new Promise((resolve, reject) => {
			let dig = `dig @${dns} ${domain}`;

			let timeout = setTimeout(() => {
				resolve(false);
			}, timeoutLength);

			let child = exec(dig, function (error, stdout, stderr) {

				clearTimeout(timeout);
				let re = /(, ANSWER: )\w+(,)/g;
				let found = stdout.match(re);

				if (found && found[0] && found[0] > 0) {
					resolve(true);
				}
				else resolve(false);

				if (error) resolve(false);

			});
		});
	}
};
