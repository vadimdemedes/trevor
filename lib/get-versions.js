'use strict';

const stableVersion = require('stable-node-version');
const pMap = require('p-map');

const re = /v(\d)/;

module.exports = config => {
	const versions = config.node_js || ['stable'];

	return pMap(versions, version => {
		if (version === 'stable' || version === 'node') {
			return stableVersion();
		}
		if (re.test(version)) {
			return version.split('').shift().join('');
		}

		return version;
	});
};
