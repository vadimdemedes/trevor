'use strict';

/**
 * Dependencies
 */

var Promise = require('bluebird');
var fetchStableVersion = require('stable-node-version');


/**
 * Expose `get-versions`
 */

module.exports = getVersions;


/**
 * Get requested Node.js versions
 */

function getVersions (config) {

	var version = config.node_js || ['stable'].map(function (version) {
		if (typeof version === 'string') {
			if (version === 'stable') {
				return fetchStableVersion();
			}
			if (version === 'node') {
				return fetchStableVersion();
			} else {
				var cleanVersion = version.replace('v','')
				return cleanVersion;
			}
		} else {
			return version;
		};
	});

	return Promise.resolve(version)


}
