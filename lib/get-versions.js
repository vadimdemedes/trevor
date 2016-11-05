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
			console.log('STABLE')
	var version = config.node_js || ['stable'].map(function (version) {
		if (version === 'stable') {
			console.log('STABLE')
			return fetchStableVersion();
		}
		if (version === 'node') {
			return fetchStableVersion();
		}
		if (typeof version === 'string') {
 						var cleanVersion = version.replace('v','')
				return cleanVersion;
		} else {
			return version;
		}

	})
	return Promise.resolve(version)
};
