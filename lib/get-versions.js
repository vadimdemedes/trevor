'use strict';

const stableVersion = require('stable-node-version');
const pMap = require('p-map');

const versionRegex = /^v(\d+\.)?(\d+\.)?(\*|\d+)$/;

module.exports = config => {
	const versions = config.node_js || ['stable'];

	return pMap(versions, version => {
		if (version === 'stable' || version === 'node') {
			return stableVersion();
		}

		if (versionRegex.test(version)) {
			return version.slice(1);
		}

		return version;
	});
};
