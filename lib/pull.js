'use strict';

const exec = require('execa');

module.exports = context => {
	const image = `node:${context.version}`;

	return exec('docker', ['pull', image]).then(() => context);
};
