'use strict';

const fetchRelease = require('fetch-node-release');
const pMap = require('p-map');

const versionRegex = /^v(\d+\.)?(\d+\.)?(\*|\d+)$/;

module.exports = config => {
	const versions = config.node_js || ['stable'];

	return pMap(versions, version => {
		if (fetchRelease.regexp.test(version)) {
			return fetchRelease(version);
		}

		if (versionRegex.test(version)) {
			return version.slice(1);
		}

		return version;
	});
};
