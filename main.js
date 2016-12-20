//number of DNS to test in parallel 
const concurrency_limit = 2;
const dig_timeout = 5000;
const dig_retries = 3;

//PubNub connection
const pn_settings = {
	  "pn_pub_key" : ''
	, "pn_sub_key" : ''
	, "pn_channel" : 'dns_test'
};

//SQlite local DB file name
const db_file = 'dns_check.sqlite';
const csv     = 'nameservers_test.csv';

//testing domains
const test_domains = [
	  { "name" : "google.com",        "key" : "google" }
	, { "name" : "baidu.com",         "key" : "baidu" }
	, { "name" : "wikipedia.com",     "key" : "wiki" }
	, { "name" : "pubsub.pubnub.com", "key" : "pubnub" }
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
		updatedDns['pn_check_count']++;

		//pubsub.pubnub.com was resolved
		if (updatedDns['pubnub']) {
			updatedDns['last_pass'] = date;
			updatedDns['pn_success_count']++;
		}
		//pubsub.pubnub.com timed out/ failed
		else {
			updatedDns['last_fail'] = date;
		}

		let num = updatedDns['pn_success_count'];
		let den = updatedDns['pn_check_count'];

		updatedDns['pn_percent_resolve'] =
		100 * ( num / den ).toFixed(2);

		resolve(updatedDns);
	});
}

module.exports = {
	  "concurrency_limit" : concurrency_limit
	, "dig_timeout"       : dig_timeout
	, "dig_retries"       : dig_retries
	, "db_file"           : db_file
	, "csv"               : csv
	, "pn_settings"       : pn_settings
	, "test_domains"      : test_domains
	, "updateDnsRecord"   : updateDnsRecord
}
