//number of DNS to test in parallel
const concurrency_limit = 150;

const dig_settings = {
	  "timeoutLength" : 5000
	, "retries"       : 3
	, "port"          : 53
	//, "protocol"      : "udp"
	//, "type"          : "A"
};

//PubNub connection
const pn_settings = {
	  "pn_pub_key" : ''
	, "pn_sub_key" : ''
	, "secret_key" : ''
	, "pn_channel" : 'dns_check'
};

//SQlite local DB file name
const db_file = 'dns_check.sqlite';
const csv     = 'test.csv';

//testing domains
const test_domains = [
	  { "name" : "google.com",        "key" : "google" }
	//, { "name" : "baidu.com",         "key" : "baidu" }
	//, { "name" : "wikipedia.com",     "key" : "wiki" }
	, { "name" : "pubsub.pubnub.com", "key" : "pubnub" }
	, { "name" : "ps.pndsn.com",      "key" : "pndsn" }
	, { "name" : "pubsub.pubnub.net", "key" : "pnnet" }
];

// logic for updating a DB row for a DNS after a dig for
// every domain in the test_domains returns or timeouts
function updateDnsRecord ( updatedDns, results ) {
	return new Promise(( resolve, reject ) => {
		for (let [i, dig] of results.entries()) {
			updatedDns[test_domains[i]["key"]] = 
			results[i] ? 1 : 0;
		}

		let date = new Date().toISOString();
		updatedDns['check_count']++;

		//pubsub.pubnub.com was resolved
		if (updatedDns['pubnub']) {
			updatedDns['last_pass'] = date;
			updatedDns['pn_success_count']++;
		}
		//pubsub.pubnub.com timed out/ failed
		else {
			updatedDns['last_fail'] = date;
		}

		if (updatedDns['pndsn']) {
			updatedDns['dsn_success_count']++;
		}

		if (updatedDns['pnnet']) {
			updatedDns['net_success_count']++;
		}

		updatedDns['pn_percent_resolve'] = 100 * (
			updatedDns['pn_success_count'] /
			updatedDns['check_count']
		).toFixed(2);

		updatedDns['dsn_percent_resolve'] = 100 * (
			updatedDns['dsn_success_count'] /
			updatedDns['check_count']
		).toFixed(2);

		updatedDns['net_percent_resolve'] = 100 * (
			updatedDns['net_success_count'] /
			updatedDns['check_count']
		).toFixed(2);

		resolve(updatedDns);
	});
}

module.exports = {
	  "concurrency_limit" : concurrency_limit
	, "dig_settings"      : dig_settings
	, "db_file"           : db_file
	, "csv"               : csv
	, "pn_settings"       : pn_settings
	, "test_domains"      : test_domains
	, "updateDnsRecord"   : updateDnsRecord
}