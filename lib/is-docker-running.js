'use strict';

const execa = require('execa');

module.exports = () => {
	return execa('docker', ['version'])
		.then(() => true)
		.catch(() => false);
};
