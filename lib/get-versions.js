'use strict';

/**
 * Dependencies
 */

var fetchStableVersion = require('stable-node-version');
var yaml = require('yamljs');
var fs = require('mz/fs');


/**
 * Expose `get-versions`
 */

module.exports = getVersions;


/**
 * Get requested Node.js versions
 */

function getVersions (path) {
	return fs.readFile(path, 'utf-8')
		.then(function (source) {
			return yaml.parse(source).node_js || ['stable'];
		})
		.map(function (version) {
			if (version === 'stable') {
				return fetchStableVersion();
			}

			return version;
		});
}
