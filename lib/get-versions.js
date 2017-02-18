'use strict';

const stableVersion = require('stable-node-version');
const pMap = require('p-map');

module.exports = config => {
	const versions = config.node_js || ['stable'];

	return pMap(versions, version => {
		if (version === 'stable' || version === 'node') {
			return stableVersion();
		}

		return version;
	});
};
