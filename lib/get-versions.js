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
	return Promise.resolve(config.node_js || ['stable']).map(function (version) {
		if (version === 'stable') {
			return fetchStableVersion();
		}

		return version;
	});
}
